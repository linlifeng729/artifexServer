/**
 * Auth 模块类型定义
 * 定义认证相关的公开类型和内部类型
 */

/**
 * 腾讯云短信配置
 */
export interface TencentSmsConfig {
  // 腾讯云API密钥ID
  secretId: string;
  // 腾讯云API密钥Key
  secretKey: string;
  // 短信应用ID，在控制台添加应用后生成的实际SDKAppID
  sdkAppId: string;
  // 签名内容，使用UTF-8编码，必须填写已审核通过的签名
  signName: string;
  // 模板ID，必须填写已审核通过的模板ID
  templateId: string;
  // 地域参数，用来标识希望操作哪个地域的数据
  region: string;
}

/**
 * 短信发送结果数据
 */
export interface SmsData {
  requestId?: string;
  error?: any;
}
