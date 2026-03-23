/**
 * 微信支付类型定义
 * 包含微信 JSAPI 支付、公众号/小程序相关的类型定义
 */

import type { TradeState } from '@/modules/pay/constants';

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
 * 微信 API 凭证缓存
 */
export interface WechatTokenCache {
  token: string;
  expiresAt: number;
}

/**
 * 微信 JSAPI Ticket 缓存
 */
export interface WechatTicketCache {
  ticket: string;
  expiresAt: number;
}

/* ==================== 微信小程序相关类型 ==================== */

/**
 * 微信小程序 App 配置
 */
export interface WechatMPConfig {
  appId: string;
  appSecret: string;
}

/**
 * 微信小程序 Code 换取 OpenId 结果
 */
export interface WechatMPOpenIdResult {
  openid: string;
  sessionKey?: string;
}
