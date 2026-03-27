/**
 * Auth 模块类型定义
 * 定义认证相关的公开类型和内部类型
 */

import { User } from '@/modules/user/entities/user.entity';

/**
 * 腾讯云短信配置
 */
export interface TencentSmsConfig {
  /** 腾讯云 API 密钥 ID */
  secretId: string;
  /** 腾讯云 API 密钥 Key */
  secretKey: string;
  /** 短信应用 ID */
  sdkAppId: string;
  /** 签名内容 */
  signName: string;
  /** 模板 ID */
  templateId: string;
  /** 地域参数 */
  region: string;
}

/**
 * 短信发送结果数据
 */
export interface SmsData {
  requestId?: string;
}

/**
 * 腾讯云短信发送状态项
 */
export interface TencentSendStatus {
  Code?: string;
  Message?: string;
  PhoneNumber?: string;
  Fee?: number;
  SessionContext?: string;
  SerialNo?: string;
}

/**
 * 腾讯云短信发送响应
 */
export interface TencentSendSmsResponse {
  RequestId?: string;
  SendStatusSet?: TencentSendStatus[];
}

/**
 * 腾讯云短信客户端接口（用于类型安全）
 */
export interface TencentSmsClient {
  SendSms(params: {
    SmsSdkAppId: string;
    SignName: string;
    TemplateId: string;
    PhoneNumberSet: string[];
    TemplateParamSet?: string[];
  }): Promise<TencentSendSmsResponse>;
}

/**
 * JWT 载荷
 */
export interface JwtPayload {
  /** 用户 UUID */
  sub: string;
  /** 加密手机号 */
  phone: string;
  /** 用户角色 */
  role: string;
}

/**
 * 验证码验证成功后的用户数据（不含敏感字段）
 */
export type VerifyCodeSuccessData = Omit<
  User,
  | 'verificationCodeHash'
  | 'verificationCodeExpiredAt'
  | 'lastCodeSentAt'
  | 'verificationCodeAttempts'
  | 'userId'
  | 'phoneHash'
>;

/**
 * 极验滑块验证响应
 */
export interface GeetestValidateResponse {
  /** 验证结果：'success' 表示通过 */
  result?: string;
  /** 验证随机数 */
  rand_str?: string;
  /** 验证签名 */
  signature?: string;
}
