import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { TencentSmsService } from './tencent-sms.service';
import { ResponseHelper, ApiResponse } from '@/common';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

/**
 * 验证码服务
 * 负责验证码的生成、发送、验证和管理
 */
@Injectable()
export class VerificationCodeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
    private readonly tencentSmsService: TencentSmsService,
  ) {}

  /**
   * 生成验证码
   * @returns 返回指定长度的数字验证码
   */
  private generateVerificationCode(): string {
    const min = Math.pow(10, AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH - 1);
    const max = Math.pow(10, AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * 发送验证码
   */
  async sendSmsCode(phone: string): Promise<ApiResponse<boolean>> {
    try {
      // 查找或创建用户记录
      const phoneHash = this.encryptionService.hashPhone(phone);
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
      const verificationCode = this.generateVerificationCode();
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
        // 创建新用户记录（仅用于验证码登录）
        const encryptedPhone = this.encryptionService.encryptPhone(phone);

        user = this.userRepository.create({
          id: randomUUID(),
          phone: encryptedPhone,
          phoneHash,
          verificationCode,
          verificationCodeExpiredAt: expiredAt,
          lastCodeSentAt: now
        });
        await this.userRepository.save(user);
      }

      // 发送短信验证码
      try {
        const smsResult = await this.tencentSmsService.sendVerificationCode(phone, verificationCode);
        
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
   * 清理过期的验证码（定时任务，每5分钟执行一次）
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredCodes(): Promise<void> {
    try {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          verificationCode: () => 'NULL',
          verificationCodeExpiredAt: () => 'NULL'
        })
        .where('verificationCodeExpiredAt < :now AND verificationCode IS NOT NULL', { now: new Date() })
        .execute();
    } catch (error) {
      // 定时任务异常不抛出，避免影响其他功能
    }
  }
}
