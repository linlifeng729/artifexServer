import { Injectable } from '@nestjs/common';
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
    // 从配置服务获取加密密钥，必须在环境变量中配置
    const encryptionKey = this.configService.get<string>('PHONE_ENCRYPTION_KEY');
    this.encryptionKey = Buffer.from(encryptionKey!, 'hex');

    // 从配置服务获取初始化向量，必须在环境变量中配置
    const iv = this.configService.get<string>('PHONE_ENCRYPTION_IV');
    this.iv = Buffer.from(iv!, 'hex');
  }

  /**
   * 加密手机号
   * @param phone 明文手机号
   * @returns 加密后的手机号
   */
  encryptPhone(phone: string): string {
    try {
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.iv);
      let encrypted = cipher.update(phone, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      throw new Error(`手机号加密失败: ${error.message}`);
    }
  }

  /**
   * 解密手机号
   * @param encryptedPhone 加密的手机号
   * @returns 明文手机号
   */
  decryptPhone(encryptedPhone: string): string {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.iv);
      let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`手机号解密失败: ${error.message}`);
    }
  }

  /**
   * 验证手机号是否匹配（用于登录验证）
   * @param plainPhone 明文手机号
   * @param encryptedPhone 加密的手机号
   * @returns 是否匹配
   */
  verifyPhone(plainPhone: string, encryptedPhone: string): boolean {
    try {
      const decryptedPhone = this.decryptPhone(encryptedPhone);
      return plainPhone === decryptedPhone;
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成手机号的哈希值（用于索引查询）
   * 使用SHA-256算法生成固定长度的哈希值
   * @param phone 明文手机号
   * @returns 手机号的哈希值
   */
  hashPhone(phone: string): string {
    return crypto.createHash('sha256').update(phone + this.encryptionKey.toString('hex')).digest('hex');
  }
}