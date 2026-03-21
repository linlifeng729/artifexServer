/**
 * 支付模块类型定义
 * 定义支付相关的公开类型和内部类型
 */

import type {
  PayChannel,
  TradeState,
  GoodsType,
  DeliveryStatus,
} from '@/modules/pay/constants';

/**
 * 公开支付订单类型（不含敏感字段）
 */
export interface PublicPayOrder {
  id: number;
  outTradeNo: string;
  amount: number;
  userId: number;
  goodsId: number;
  goodsType: GoodsType;
  tradeState: TradeState | null;
  successTime: string | null;
  transactionId: string | null;
  payChannel: PayChannel;
  description: string | null;
  callbackUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 内部支付订单类型（包含敏感字段）
 */
export interface InternalPayOrder extends PublicPayOrder {
  appId: string | null;
}

/**
 * 公开发货记录类型
 */
export interface PublicDeliveryRecord {
  id: number;
  orderId: string;
  userId: number;
  goodsId: number;
  goodsType: GoodsType;
  deliveryStatus: DeliveryStatus;
  deliveryTime: Date | null;
  deliveryMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 支付订单创建结果
 */
export interface PayOrderCreatedResult {
  outTradeNo: string;
  orderId: number;
}

/**
 * 支付宝支付参数
 */
export interface AlipayPayParams {
  outTradeNo: string;
  totalAmount: number;
  subject: string;
  productCode: string;
  quitUrl: string;
}

/**
 * 支付宝支付响应
 */
export interface AlipayPayResponse {
  code: string;
  msg: string;
  outTradeNo: string;
  tradeNo: string;
}

/**
 * 微信支付统一下单参数
 */
export interface WechatPayUnifiedOrderParams {
  appid: string;
  mchid: string;
  description: string;
  outTradeNo: string;
  notifyUrl: string;
  amount: {
    total: number;
  };
  payer?: {
    openid: string;
  };
}

/**
 * 微信支付统一下单响应
 */
export interface WechatPayUnifiedOrderResponse {
  codeUrl?: string;
  prepayId?: string;
}

/**
 * 微信 JSAPI 调起支付参数
 */
export interface WechatJsapiPayParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
  callbackUrl?: string;
}

/**
 * 微信支付通知数据
 */
export interface WechatPayNotifyData {
  outTradeNo: string;
  transactionId: string;
  tradeState: string;
  tradeStateDesc: string;
  successTime: string;
  amount: {
    total: number;
    payerTotal: number;
    currency: string;
    payerCurrency: string;
  };
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
 * 微信公众号 JS-SDK 签名
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

/**
 * 支付订单查询参数
 */
export interface PayOrderQueryParams {
  page?: number;
  limit?: number;
  tradeState?: TradeState;
  payChannel?: PayChannel;
  startDate?: string;
  endDate?: string;
}

/**
 * 支付订单分页结果
 */
export interface PayOrderPaginatedResult {
  list: PublicPayOrder[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}
