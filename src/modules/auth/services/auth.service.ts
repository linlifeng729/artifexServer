import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ICrypto } from '@/common/utils/crypto';
import { HASH_ALGORITHMS, ENCODINGS } from '@/common/types/crypto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { UserService } from '@/modules/user/services/user.service';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { TencentSmsService } from './tencent-sms.service';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

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
  ) {}

  /**
   * 用户登录
   * @param loginDto 登录数据传输对象，包含手机号和验证码
   */
  async userLogin(loginDto: LoginDto): Promise<ApiResponse<{ user: any, token: string }>> {
    const { phone, verificationCode: inputCode } = loginDto;
    
    // 验证验证码
    const verifyResult = await this.verifyCode(phone, inputCode);
    
    if (!verifyResult.success || !verifyResult.data) {
      throw new BadRequestException(verifyResult.message || '手机号或验证码错误');
    }

    const user = verifyResult.data;

    // 根据用户角色设置token有效期
    const expiresIn = user.role === AUTH_CONSTANTS.ROLES.ADMIN 
      ? AUTH_CONSTANTS.JWT.ADMIN_EXPIRATION 
      : AUTH_CONSTANTS.JWT.USER_EXPIRATION;

    // 生成JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload, { expiresIn });

    // 返回不包含敏感字段的用户信息（排除 userId、phoneHash 等内部字段）
    const { userId, phoneHash, ...result } = user;

    return ResponseHelper.success({
      user: result,
      token
    }, '登录成功');
  }

  /**
   * 发送验证码
   * @param sendCodeDto 发送验证码数据传输对象，包含手机号和滑块验证码
   */
  async sendSmsCode(sendCodeDto: SendVerificationCodeDto): Promise<ApiResponse<boolean>> {
    try {
      // 校验滑块验证码
      await this.validateGeetestCaptcha(sendCodeDto);

      // 查找或创建用户记录
      const phoneHash = this.encryptionService.hashPhone(sendCodeDto.phone);
      let user = await this.userRepository.findOne({ where: { phoneHash } });

      // 检查发送频率限制
      if (user?.lastCodeSentAt) {
        const intervalMs = AUTH_CONSTANTS.VERIFICATION_CODE.SEND_INTERVAL_SECONDS * 1000;
        const timeDiff = Date.now() - user.lastCodeSentAt.getTime();
        if (timeDiff < intervalMs) {
          const remainingTime = Math.ceil((intervalMs - timeDiff) / 1000);
          const message = `请等待${remainingTime}秒后再重新发送验证码`;
          throw new BadRequestException(message);
        }
      }

      // 生成验证码和过期时间
      const verificationCode = this._generateVerificationCode();
      const expirationMs = AUTH_CONSTANTS.VERIFICATION_CODE.EXPIRATION_MINUTES * 60 * 1000;
      const expiredAt = new Date(Date.now() + expirationMs);
      const now = new Date();

      if (user) {
        // 更新现有用户的验证码
        await this.userRepository.update(user.userId, {
          verificationCode,
          verificationCodeExpiredAt: expiredAt,
          lastCodeSentAt: now
        });
      } else {
        // 创建新用户记录（用于验证码登录）
        const encryptedPhone = this.encryptionService.encryptPhone(sendCodeDto.phone);

        user = this.userRepository.create({
          id: randomUUID(),
          phone: encryptedPhone,
          nickname: this._maskPhoneNumber(sendCodeDto.phone),
          phoneHash,
          verificationCode,
          verificationCodeExpiredAt: expiredAt,
          lastCodeSentAt: now
        });
        await this.userRepository.save(user);
      }

      // 发送短信验证码
      try {
        const smsResult = await this.tencentSmsService.sendSmsCode(sendCodeDto.phone, verificationCode);
        
        if (!smsResult.success) {
          throw new InternalServerErrorException(smsResult.message || '验证码发送失败，请稍后重试');
        }
      } catch (error) {
        if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
          throw error;
        }
        throw new InternalServerErrorException('验证码发送失败，请稍后重试');
      }

      return ResponseHelper.success(true, '验证码发送成功');
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('验证码发送失败，请稍后重试');
    }
  }

  /**
   * 生成验证码
   * @returns 返回指定长度的数字验证码
   */
  private _generateVerificationCode(): string {
    const min = Math.pow(10, AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH - 1);
    const max = Math.pow(10, AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * 脱敏处理手机号
   * @param phone 原始手机号
   * @returns 脱敏后的手机号格式 137****1111
   */
  private _maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 11) {
      return phone;
    }
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  /**
   * 验证验证码（使用事务确保原子性操作）
   */
  async verifyCode(phone: string, code: string): Promise<ApiResponse<Omit<User, 'verificationCode' | 'verificationCodeExpiredAt'> | null>> {
    // 使用事务确保验证码验证和清除是原子操作
    return await this.dataSource.transaction(async manager => {
      try {
        const userPhoneHash = this.encryptionService.hashPhone(phone);
        
        // 在事务中查找用户，加锁防止并发问题
        const user = await manager.findOne(User, { 
          where: { phoneHash: userPhoneHash, isActive: true },
          lock: { mode: 'pessimistic_write' }
        });

        if (!user) {
          return ResponseHelper.error('用户不存在', null);
        }

        if (!user.verificationCode) {
          return ResponseHelper.error('请先获取验证码', null);
        }

        // 检查验证码是否过期
        if (!user.verificationCodeExpiredAt || user.verificationCodeExpiredAt < new Date()) {
          // 清除过期的验证码
          await manager.update(User, user.userId, {
            verificationCode: () => 'NULL',
            verificationCodeExpiredAt: () => 'NULL'
          });
          return ResponseHelper.error('验证码已过期，请重新获取', null);
        }

        // 验证验证码
        if (user.verificationCode !== code) {
          return ResponseHelper.error('验证码错误', null);
        }

        // 验证成功，立即清除验证码（在同一事务中）
        await manager.update(User, user.userId, {
          verificationCode: () => 'NULL',
          verificationCodeExpiredAt: () => 'NULL'
        });

        // 返回用户信息（不包含敏感字段）
        const { verificationCode, verificationCodeExpiredAt, ...result } = user;
        
        return ResponseHelper.success(result, '验证码验证成功');
      } catch (error) {
        return ResponseHelper.error('验证失败，请稍后重试', null);
      }
    });
  }

  /**
   * 验证JWT token并获取用户信息
   * @param token JWT token
   * @returns 用户信息
   * @throws BadRequestException 当token无效时
   * @throws InternalServerErrorException 当用户信息获取失败时
   */
  async validateToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // 根据 JWT payload 中的用户ID获取完整的用户信息（包含 userId 用于内部业务）
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
  private async validateGeetestCaptcha(captchaData: SendVerificationCodeDto): Promise<void> {
    const { captcha_id, lot_number, captcha_output, pass_token, gen_time } = captchaData;

    // 获取极验配置
    const geetestKey = this.configService.get<string>('GEETEST_LOGIN_KEY');
    const geetestDomain = this.configService.get<string>('GEETEST_LOGIN_DOMAIN');

    // 生成 sign_token
    const signToken = ICrypto.createHmac(lot_number, geetestKey!, HASH_ALGORITHMS.SHA256, ENCODINGS.HEX)

    try {
      await this.httpService.axiosRef.post(
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
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new BadRequestException('滑块验证失败，请重试');
    }
  }
}
