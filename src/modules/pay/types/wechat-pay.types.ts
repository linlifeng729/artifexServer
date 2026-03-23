/**
 * 微信支付类型定义
 * 包含微信 Native 支付、JSAPI 支付、公众号/小程序相关的类型定义
 */

import type {
  PayChannel,
  TradeState,
} from '@/modules/pay/constants';

/**
 * 微信 Native 支付统一下单参数（微信 API 原始字段）
 */
export interface WechatPayUnifiedOrderParams {
  appid: string;
  mchid: string;
  description: string;
  out_trade_no: string;
  notify_url: string;
  amount: {
    total: number;
  };
  payer?: {
    openid: string;
  };
}

/**
 * 微信 Native 支付统一下单响应（code_url）
 */
export interface WechatPayNativeOrderResponse {
  codeUrl: string;
}

/**
 * 微信 JSAPI 支付统一下单响应（prepay_id）
 */
export interface WechatPayJsapiOrderResponse {
  prepayId: string;
}

/**
 * 微信 JSAPI 调起支付参数
 * 用于客户端通过 JSSDK 调起支付
 */
export interface WechatJsapiPayParams {
  nonceStr: string;
  timestamp: number;
  package: string;
  signType: string;
  paySign: string;
  callbackUrl?: string;
}

/**
 * 微信支付通知回调数据（解密后，微信 API 原始字段）
 */
export interface WechatPayNotifyData {
  out_trade_no: string;
  transaction_id: string;
  trade_state: TradeState;
  success_time: string;
}

/**
 * 微信 JSAPI 支付调起参数（客户端使用）
 */
export interface WechatJsapiPayRequestParams extends WechatJsapiPayParams {
  appId: string;
}

/* ==================== 微信公众号/小程序相关类型 ==================== */

/**
 * 微信公众号 App 配置
 */
export interface WechatOAConfig {
  appId: string;
  appSecret: string;
  token: string;
}

/**
 * 微信公众号获取 OpenId 参数
 */
export interface WechatOAOpenIdParams {
  appId: string;
  appSecret: string;
  code: string;
  grantType: string;
}

/**
 * 微信公众号获取 OpenId 响应
 */
export interface WechatOAOpenIdResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  openid: string;
  scope: string;
}

/**
 * 微信公众号 Code 换取 OpenId 结果
 */
export interface WechatOAOpenIdResult {
  openid: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  scope: string;
}

/**
 * 微信 JS-SDK 签名
 */
export interface WechatOAJsSdkSignature {
  signature: string;
  timestamp: string;
  nonceStr: string;
  appId: string;
}

/**
 * 微信小程序获取 OpenId 参数
 */
export interface WechatMPOpenIdParams {
  appId: string;
  appSecret: string;
  jsCode: string;
  grantType: string;
}

/**
 * 微信小程序获取 OpenId 响应
 */
export interface WechatMPOpenIdResponse {
  openid: string;
  sessionKey?: string;
}
