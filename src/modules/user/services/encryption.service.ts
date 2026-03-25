import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * 加密服务
 * 用于手机号等敏感信息的加密和解密
 */
@Injectable()
export class EncryptionService {
  // AES-256-CBC 加密密钥 (32字节)
  private readonly encryptionKey: Buffer;

  // 初始化向量 (16字节)
  private readonly iv: Buffer;

  constructor(private readonly configService: ConfigService) {
    const requiredConfigs = [
      'PHONE_ENCRYPTION_KEY',
      'PHONE_ENCRYPTION_IV',
    ];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      throw new InternalServerErrorException(
        `[加密服务] 配置缺失: ${missingConfigs.join(', ')}，请检查环境变量是否已配置`,
      );
    }

    this.encryptionKey = Buffer.from(
      this.configService.get<string>('PHONE_ENCRYPTION_KEY')!,
      'hex',
    );
    this.iv = Buffer.from(
      this.configService.get<string>('PHONE_ENCRYPTION_IV')!,
      'hex',
    );
  }

  /**
   * 加密手机号
   * @param phone 明文手机号
   * @returns 加密后的手机号
   */
  encryptPhone(phone: string): string {
    try {
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        this.encryptionKey,
        this.iv,
      );
      let encrypted = cipher.update(phone, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new InternalServerErrorException('手机号加密失败', {
        cause: error,
      });
    }
  }

  /**
   * 解密手机号
   * @param encryptedPhone 加密的手机号
   * @returns 明文手机号
   */
  decryptPhone(encryptedPhone: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        this.encryptionKey,
        this.iv,
      );
      let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException('手机号解密失败', {
        cause: error,
      });
    }
  }

  /**
   * 生成手机号的哈希值（用于索引查询）
   * 使用SHA-256算法生成固定长度的哈希值
   * @param phone 明文手机号
   * @returns 手机号的哈希值
   */
  hashPhone(phone: string): string {
    return crypto
      .createHash('sha256')
      .update(phone + this.encryptionKey.toString('hex'))
      .digest('hex');
  }
}
