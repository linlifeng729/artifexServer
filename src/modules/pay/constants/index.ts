/**
 * 支付模块常量定义
 * 统一管理所有支付相关的常量、枚举和配置
 */

/**
 * 支付渠道枚举
 */
export const PAY_CHANNEL = {
  ALIPAY: 'alipay' as const, // 支付宝
  WECHAT_PAY: 'wechat_pay' as const, // 微信支付
  WECHAT_MP: 'wechat_mp' as const, // 小程序支付
  WECHAT_OA: 'wechat_oa' as const, // 公众号支付
} as const;

/**
 * 交易状态枚举
 */
export const TRADE_STATE = {
  /** 等待买家付款 */
  WAIT_BUYER_PAY: 'WAIT_BUYER_PAY' as const,
  /** 交易支付成功 */
  TRADE_SUCCESS: 'TRADE_SUCCESS' as const,
  /** 交易结束，不可退款 */
  TRADE_FINISHED: 'TRADE_FINISHED' as const,
  /** 交易关闭（未付款） */
  TRADE_CLOSED: 'TRADE_CLOSED' as const,
  /** 订单退款 */
  TRADE_REFUND: 'REFUND' as const,
} as const;

/**
 * 发货状态枚举
 */
export const DELIVERY_STATUS = {
  NOT_DELIVERED: 0 as const, // 未发货
  DELIVERED: 1 as const, // 已发货
  DELIVERY_FAILED: 2 as const, // 发货失败
} as const;

/**
 * 支付渠道类型定义
 */
export type PayChannel = (typeof PAY_CHANNEL)[keyof typeof PAY_CHANNEL];

/**
 * 交易状态类型定义
 */
export type TradeState = (typeof TRADE_STATE)[keyof typeof TRADE_STATE];

/**
 * 发货状态类型定义
 */
export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

/**
 * 字段长度限制
 */
export const PAY_CONSTRAINTS = {
  OUT_TRADE_NO_MAX_LENGTH: 64,
  DESCRIPTION_MAX_LENGTH: 255,
  CALLBACK_URL_MAX_LENGTH: 255,
  APP_ID_MAX_LENGTH: 32,
  TRANSACTION_ID_MAX_LENGTH: 64,
  MIN_AMOUNT: 1, // 最小金额（分）
} as const;

/**
 * 微信支付接口地址
 */
export const WX_PAY_API = {
  /** 微信 Native 支付 */
  NATIVE: '/v3/pay/transactions/native',
  /** 微信 JSAPI 支付 */
  JSAPI: '/v3/pay/transactions/jsapi',
  /** 微信 H5 支付 */
  H5: '/v3/pay/transactions/h5',
} as const;

/**
 * 微信 API 域名
 */
export const WX_API_CONFIG = {
  MCH_DOMAIN: 'https://api.mch.weixin.qq.com',
  API_DOMAIN: 'https://api.weixin.qq.com',
} as const;

/**
 * 支付宝接口类型枚举
 */
export const ALIPAY_ORDER_INTERFACE = {
  /** PC 端二维码支付 */
  PAGE_PAY: 'alipay.trade.page.pay',
  /** H5 支付 */
  WAP_PAY: 'alipay.trade.wap.pay',
} as const;

export type AlipayOrderInterface =
  (typeof ALIPAY_ORDER_INTERFACE)[keyof typeof ALIPAY_ORDER_INTERFACE];

/**
 * 分页相关限制
 */
export const PAGINATION_CONSTRAINTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
