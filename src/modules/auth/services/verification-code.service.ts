import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '@/modules/user/entities/user.entity';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { TencentSmsService } from './tencent-sms.service';

/**
 * 验证码服务
 * 负责验证码的生成、发送、验证和管理
 */
@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
    private readonly tencentSmsService: TencentSmsService,
  ) {}

  /**
   * 生成6位数字验证码
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // 查找或创建用户记录
      const phoneHash = this.encryptionService.hashPhone(phone);
      let user = await this.userRepository.findOne({ where: { phoneHash } });

      // 检查发送频率限制（60秒内不能重复发送）
      if (user?.lastCodeSentAt) {
        const timeDiff = Date.now() - user.lastCodeSentAt.getTime();
        if (timeDiff < 60000) { // 60秒
          const remainingTime = Math.ceil((60000 - timeDiff) / 1000);
          return {
            success: false,
            message: `请等待${remainingTime}秒后再重新发送验证码`
          };
        }
      }

      // 生成验证码和过期时间（5分钟后过期）
      const verificationCode = this.generateVerificationCode();
      const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期
      const now = new Date();

      if (user) {
        // 更新现有用户的验证码
        await this.userRepository.update(user.id, {
          verificationCode,
          verificationCodeExpiredAt: expiredAt,
          lastCodeSentAt: now
        });
      } else {
        // 创建新用户记录（仅用于验证码登录）
        const encryptedPhone = this.encryptionService.encryptPhone(phone);
        user = this.userRepository.create({
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
          this.logger.error(`短信发送失败: ${smsResult.message}`);
          return {
            success: false,
            message: smsResult.message || '验证码发送失败，请稍后重试'
          };
        }
      } catch (error) {
        this.logger.error('发送短信验证码异常:', error);
        return {
          success: false,
          message: '短信发送异常，请稍后重试'
        };
      }

      return {
        success: true,
        message: '验证码发送成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '验证码发送失败，请稍后重试'
      };
    }
  }

  /**
   * 验证验证码（使用事务确保原子性操作）
   */
  async verifyCode(phone: string, code: string): Promise<{
    success: boolean;
    message: string;
    user?: Omit<User, 'verificationCode' | 'verificationCodeExpiredAt'>;
  }> {
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
          return {
            success: false,
            message: '用户不存在'
          };
        }

        if (!user.verificationCode) {
          return {
            success: false,
            message: '请先获取验证码'
          };
        }

        // 检查验证码是否过期
        if (!user.verificationCodeExpiredAt || user.verificationCodeExpiredAt < new Date()) {
          // 清除过期的验证码
          await manager.update(User, user.id, {
            verificationCode: undefined,
            verificationCodeExpiredAt: undefined
          });
          return {
            success: false,
            message: '验证码已过期，请重新获取'
          };
        }

        // 验证验证码
        if (user.verificationCode !== code) {
          return {
            success: false,
            message: '验证码错误'
          };
        }

        // 验证成功，立即清除验证码（在同一事务中）
        await manager.update(User, user.id, {
          verificationCode: undefined,
          verificationCodeExpiredAt: undefined
        });

        // 返回用户信息（不包含敏感字段）
        const { verificationCode, verificationCodeExpiredAt, ...result } = user;
        
        return {
          success: true,
          message: '验证码验证成功',
          user: result
        };
      } catch (error) {
        this.logger.error('验证码验证异常:', error);
        return {
          success: false,
          message: '验证失败，请稍后重试'
        };
      }
    });
  }

  /**
   * 清理过期的验证码（定时任务，每5分钟执行一次）
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredCodes(): Promise<void> {
    try {
      const now = new Date();
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({
          verificationCode: undefined,
          verificationCodeExpiredAt: undefined
        })
        .where('verificationCodeExpiredAt < :now', { now })
        .execute();
    } catch (error) {
      this.logger.error('清理过期验证码失败:', error);
    }
  }
}
