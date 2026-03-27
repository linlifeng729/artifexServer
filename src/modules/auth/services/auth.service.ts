import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ICrypto } from '@/common/utils/crypto';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';
import { HASH_ALGORITHMS, ENCODINGS } from '@/common/types/crypto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { UserService } from '@/modules/user/services/user.service';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { TencentSmsService } from './tencent-sms.service';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import { AUTH_CONSTANTS } from '@/modules/auth/constants';
import { USER_CONSTANTS } from '@/modules/user/constants';
import {
  JwtPayload,
  VerifyCodeSuccessData,
  GeetestValidateResponse,
} from '@/modules/auth/types';
import { RedisLockService } from '@/common/services/redis-lock.service';
import { LoggingService } from '@/common/services/logging.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly tencentSmsService: TencentSmsService,
    private readonly httpService: HttpService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
    private readonly redisLockService: RedisLockService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * 用户登录
   * @param loginDto 登录数据传输对象，包含手机号和验证码
   */
  async userLogin(
    loginDto: LoginDto,
  ): Promise<ApiResponse<{ user: VerifyCodeSuccessData; token: string }>> {
    const { phone, verificationCode: inputCode } = loginDto;

    // 验证验证码（bcrypt 哈希比对 + 事务）
    const verifyResult = await this.verifyCode(phone, inputCode);

    if (!verifyResult.success || !verifyResult.data) {
      throw new BadRequestException(
        verifyResult.message || '手机号或验证码错误',
      );
    }

    const user = verifyResult.data;

    // 根据用户角色设置 token 有效期
    const expiresIn =
      user.role === USER_CONSTANTS.ROLES.ADMIN
        ? AUTH_CONSTANTS.JWT.ADMIN_EXPIRATION
        : AUTH_CONSTANTS.JWT.USER_EXPIRATION;

    // 生成 JWT token（payload 包含 role，减少后续鉴权查询）
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, { expiresIn });

    return ResponseHelper.success({ user, token }, '登录成功');
  }

  /**
   * 发送验证码
   * @param sendCodeDto 发送验证码数据传输对象，包含手机号和滑块验证码
   */
  async sendSmsCode(
    sendCodeDto: SendVerificationCodeDto,
  ): Promise<ApiResponse<boolean>> {
    const lockKey = `sms:send:${sendCodeDto.phone}`;

    return await this.redisLockService.withLock(
      lockKey,
      async () => {
        try {
          // 校验滑块验证码
          await this.validateGeetestCaptcha(sendCodeDto);

          // 查找或创建用户记录
          const phoneHash = this.encryptionService.hashPhone(sendCodeDto.phone);
          let user = await this.userRepository.findOne({
            where: { phoneHash },
            select: ['userId', 'phoneHash', 'lastCodeSentAt', 'isActive'],
          });

          // 检查发送频率限制
          if (user?.lastCodeSentAt) {
            const intervalMs =
              AUTH_CONSTANTS.VERIFICATION_CODE.SEND_INTERVAL_SECONDS * 1000;
            const timeDiff = Date.now() - user.lastCodeSentAt.getTime();
            if (timeDiff < intervalMs) {
              const remainingTime = Math.ceil((intervalMs - timeDiff) / 1000);
              const message = `请等待${remainingTime}秒后再重新发送验证码`;
              throw new BadRequestException(message);
            }
          }

          // 生成验证码和过期时间
          const verificationCode = ICrypto.generateRandomIntByLength(
            AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH,
          );
          const expirationMs =
            AUTH_CONSTANTS.VERIFICATION_CODE.EXPIRATION_MINUTES * 60 * 1000;
          const expiredAt = new Date(Date.now() + expirationMs);
          const now = new Date();

          // bcrypt 哈希存储验证码
          const codeHash = await bcrypt.hash(
            verificationCode,
            AUTH_CONSTANTS.SECURITY.BCRYPT_SALT_ROUNDS,
          );

          if (user) {
            // 更新现有用户的验证码哈希
            await this.userRepository.update(user.userId, {
              verificationCodeHash: codeHash,
              verificationCodeExpiredAt: expiredAt,
              lastCodeSentAt: now,
              verificationCodeAttempts: AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS,
            });
          } else {
            // 创建新用户记录（用于验证码登录）
            const encryptedPhone = this.encryptionService.encryptPhone(
              sendCodeDto.phone,
            );

            user = this.userRepository.create({
              id: ICrypto.generateUUID(),
              phone: encryptedPhone,
              nickname: this.maskPhoneNumber(sendCodeDto.phone),
              phoneHash,
              verificationCodeHash: codeHash,
              verificationCodeExpiredAt: expiredAt,
              lastCodeSentAt: now,
              verificationCodeAttempts: AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS,
            });
            await this.userRepository.save(user);
          }

          // 发送短信验证码
          const smsResult = await this.tencentSmsService.sendSmsCode(
            sendCodeDto.phone,
            verificationCode,
          );

          if (!smsResult.success) {
            throw new InternalServerErrorException(
              '验证码发送失败，请稍后重试',
            );
          }

          return ResponseHelper.success(true, '验证码发送成功');
        } catch (error) {
          if (
            error instanceof BadRequestException ||
            error instanceof InternalServerErrorException
          ) {
            throw error;
          }
          throw new InternalServerErrorException('验证码发送失败，请稍后重试');
        }
      },
      AUTH_CONSTANTS.SECURITY.SMS_LOCK_TTL_MS,
    );
  }

  /**
   * 脱敏处理手机号
   * @param phone 原始手机号
   * @returns 脱敏后的手机号格式 137****1111
   */
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 11) {
      return phone;
    }
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  /**
   * 验证验证码
   * 验证码以 bcrypt 哈希存储，验证时使用 bcrypt.compare 进行时序安全比对
   *
   * 安全策略：
   * - 悲观锁防止并发重复使用
   * - 连续错误超过 MAX_ATTEMPTS 次后强制清除验证码（防止暴力枚举）
   * - 验证失败不立即清除验证码，仅累加错误次数（防止验证码置零攻击）
   * - 验证成功或超限才清除验证码
   */
  async verifyCode(
    phone: string,
    code: string,
  ): Promise<ApiResponse<VerifyCodeSuccessData | null>> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const userPhoneHash = this.encryptionService.hashPhone(phone);

        // 在事务中查找用户，加锁防止并发问题
        const user = await manager.findOne(User, {
          where: { phoneHash: userPhoneHash, isActive: true },
          lock: { mode: 'pessimistic_write' },
        });

        if (!user) {
          return ResponseHelper.error('用户不存在', null);
        }

        if (!user.verificationCodeHash) {
          return ResponseHelper.error('请先获取验证码', null);
        }

        // 检查是否已达到最大错误次数
        const maxAttempts = AUTH_CONSTANTS.VERIFICATION_CODE.MAX_ATTEMPTS;
        const currentAttempts = user.verificationCodeAttempts || 0;
        if (currentAttempts >= maxAttempts) {
          // 清除已被锁定的验证码，要求用户重新获取
          await manager.update(User, user.userId, {
            verificationCodeHash: undefined,
            verificationCodeExpiredAt: undefined,
            verificationCodeAttempts: AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS,
          });
          return ResponseHelper.error('验证码尝试次数过多，请重新获取', null);
        }

        // 检查验证码是否过期
        if (
          !user.verificationCodeExpiredAt ||
          user.verificationCodeExpiredAt < new Date()
        ) {
          // 清除过期的验证码
          await manager.update(User, user.userId, {
            verificationCodeHash: undefined,
            verificationCodeExpiredAt: undefined,
            verificationCodeAttempts: AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS,
          });
          return ResponseHelper.error('验证码已过期，请重新获取', null);
        }

        // bcrypt 时序安全比对验证码
        const isValid = await bcrypt.compare(code, user.verificationCodeHash);

        if (!isValid) {
          // 使用 SQL 原子递增，防止并发竞态导致计数丢失
          // 即使多个请求同时到达，DB 层也会正确累加到真实猜测次数
          const updated = await manager
            .createQueryBuilder()
            .update(User)
            .set({ verificationCodeAttempts: () => 'verificationCodeAttempts + 1' })
            .where('userId = :userId', { userId: user.userId })
            .andWhere('verificationCodeAttempts < :maxAttempts', { maxAttempts })
            .execute();

          // 若更新行数为0，说明已达到上限（已被另一事务更新）
          if (updated.affected === 0) {
            return ResponseHelper.error('验证码尝试次数过多，请重新获取', null);
          }

          // 从 updated 值反推剩余次数（updated.affected=1 表示本次 +1 后仍在限制内）
          const remainingAttempts = maxAttempts - (user.verificationCodeAttempts || AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS) - 1;

          // 接近锁定阈值时给出明确提示，但不暴露具体错误原因
          if (remainingAttempts > 0 && remainingAttempts <= 2) {
            return ResponseHelper.error(
              `验证码错误，剩余 ${remainingAttempts} 次尝试机会`,
              null,
            );
          }

          return ResponseHelper.error('验证码错误', null);
        }

        // 验证成功，清除验证码哈希并重置错误计数（同一事务，确保原子性）
        await manager.update(User, user.userId, {
          verificationCodeHash: undefined,
          verificationCodeExpiredAt: undefined,
          verificationCodeAttempts: AUTH_CONSTANTS.VERIFICATION_CODE.INITIAL_ATTEMPTS,
        });

        const userPublicFields: VerifyCodeSuccessData = {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        return ResponseHelper.success(userPublicFields, '验证码验证成功');
      } catch {
        return ResponseHelper.error('验证失败，请稍后重试', null);
      }
    });
  }

  /**
   * 验证 JWT token 并获取用户信息
   * @param token JWT token
   * @returns 用户信息
   */
  async validateToken(token: string) {
    try {
      const payload = (await this.jwtService.verifyAsync(
        token,
      )) as unknown as JwtPayload;

      const user = await this.userService.getUserByIdInternal(payload.sub);

      if (!user) {
        throw new InternalServerErrorException('用户不存在');
      }

      return user;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new BadRequestException('无效的访问令牌');
    }
  }

  /**
   * 校验极验滑块验证码
   * @param captchaData 滑块验证码数据
   */
  private async validateGeetestCaptcha(
    captchaData: SendVerificationCodeDto,
  ): Promise<void> {
    const { captcha_id, lot_number, captcha_output, pass_token, gen_time } =
      captchaData;

    const geetestKey = this.configService.get<string>('GEETEST_LOGIN_KEY');
    const geetestDomain = this.configService.get<string>(
      'GEETEST_LOGIN_DOMAIN',
    );

    if (!geetestKey || !geetestDomain) {
      throw new InternalServerErrorException('极验配置错误，请检查环境变量');
    }

    // 生成 sign_token
    const signToken = ICrypto.createHmac(
      lot_number,
      geetestKey,
      HASH_ALGORITHMS.SHA256,
      ENCODINGS.HEX,
    );

    try {
      const response = await this.httpService.axiosRef.post(
        `${geetestDomain}${AUTH_CONSTANTS.GEETEST.VALIDATE_PATH}`,
        new URLSearchParams({
          lot_number,
          captcha_output,
          pass_token,
          gen_time,
          captcha_id,
          sign_token: signToken,
        }).toString(),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // 检查极验业务结果
      const geetestResult = response.data as GeetestValidateResponse;
      if (geetestResult.result !== 'success') {
        this.loggingService.warn('[极验验证] 滑块验证失败，请客户端重试');
        throw new BadRequestException('滑块验证失败，请重试');
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new BadRequestException('滑块验证失败，请重试');
    }
  }
}
