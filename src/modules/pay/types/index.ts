/**
 * 支付模块类型定义
 * 定义支付相关的公开类型和内部类型
 */

import type {
  PayChannel,
  TradeState,
  DeliveryStatus,
} from '@/modules/pay/constants';

// 微信支付相关类型（从独立文件导出）
export type {
  WechatPayUnifiedOrderParams,
  WechatPayNativeOrderResponse,
  WechatPayJsapiOrderResponse,
  WechatJsapiPayParams,
  WechatJsapiPayRequestParams,
  WechatPayNotifyData,
  WechatOAConfig,
  WechatOAOpenIdParams,
  WechatOAOpenIdResponse,
  WechatOAOpenIdResult,
  WechatOAJsSdkSignature,
  WechatMPOpenIdParams,
  WechatMPOpenIdResponse,
} from './wechat-pay.types';

// 支付宝相关类型（从独立文件导出）
export type {
  AlipayGeneratePayFormParams,
  AlipayCreateOrderParams,
  AlipayNotifyParams,
  AlipayVerifySignParams,
} from './alipay.types';

/* ==================== 支付订单相关类型 ==================== */

/**
 * 公开支付订单类型（不含敏感字段）
 */
export interface PublicPayOrder {
  id: number;
  outTradeNo: string;
  amount: number;
  userId: number;
  goodsId: number;
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
 * 支付订单创建结果
 */
export interface PayOrderCreatedResult {
  outTradeNo: string;
  orderId: number;
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

/* ==================== 发货记录相关类型 ==================== */

/**
 * 公开发货记录类型
 */
export interface PublicDeliveryRecord {
  id: number;
  orderId: string;
  userId: number;
  goodsId: number;
  deliveryStatus: DeliveryStatus;
  deliveryTime: Date | null;
  deliveryMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
