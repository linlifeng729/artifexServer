/**
 * 支付模块常量定义
 * 统一管理所有支付相关的常量、枚举和配置
 */

/**
 * 支付模块常量命名空间
 * 统一导出所有支付常量，便于 DTO/Service/Controller 引用
 */
export const PAY_CONSTANTS = {
  /**
   * 锁 Key 前缀
   */
  LOCK_KEYS: {
    /** 订单创建锁前缀 */
    ORDER_CREATE: 'pay:order:create:',
    /** 订单回调处理锁前缀 */
    ORDER_NOTIFY: 'pay:order:notify:',
    /** 发货处理锁前缀 */
    ORDER_DELIVERY: 'pay:order:delivery:',
  },

  /**
   * 支付渠道
   */
  CHANNEL: {
    /** 支付宝扫码支付 */
    ALIPAY: 'alipay' as const,
    /** 支付宝H5支付 */
    ALIPAY_H5: 'alipay_h5' as const,
    /** 微信支付 */
    WECHAT_PAY: 'wechat_pay' as const,
    /** 微信小程序支付 */
    WECHAT_MP: 'wechat_mp' as const,
    /** 微信公众号支付 */
    WECHAT_OA: 'wechat_oa' as const,
  },

  /**
   * 交易状态
   */
  STATUS: {
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
  },

  /**
   * 发货状态
   */
  DELIVERY: {
    NOT_DELIVERED: 0 as const,
    DELIVERED: 1 as const,
    DELIVERY_FAILED: 2 as const,
  },

  /**
   * 微信支付接口地址
   */
  WX_PAY_API: {
    NATIVE: '/v3/pay/transactions/native',
    JSAPI: '/v3/pay/transactions/jsapi',
    H5: '/v3/pay/transactions/h5',
  },

  /**
   * 微信 API 域名
   */
  WX_API_CONFIG: {
    MCH_DOMAIN: 'https://api.mch.weixin.qq.com',
    API_DOMAIN: 'https://api.weixin.qq.com',
  },

  /**
   * 微信 API 接口路径（需拼接 WX_API_CONFIG.API_DOMAIN 使用）
   */
  WX_API: {
    /** 微信公众号授权获取 OpenId */
    OA_ACCESS_TOKEN: '/sns/oauth2/access_token',
    /** 微信公众号全局 AccessToken */
    OA_TOKEN: '/cgi-bin/token',
    /** 微信公众号 JSAPI Ticket */
    OA_JSAPI_TICKET: '/cgi-bin/ticket/getticket',
    /** 微信小程序登录获取 OpenId */
    MP_JSCODE2SESSION: '/sns/jscode2session',
  },

  /**
   * 支付宝接口类型
   */
  ALIPAY_INTERFACE: {
    /** 扫码支付 */
    FACE_TO_FACE_PAY: 'alipay.trade.page.pay',
    /** H5支付 */
    WAP_PAY: 'alipay.trade.wap.pay',
  },

  /**
   * 回调域名
   */
  DOMAIN: 'https://linlifeng.top',
} as const;

/* -------------------- 类型导出 -------------------- */

/** 支付渠道类型 */
export type PayChannel =
  (typeof PAY_CONSTANTS.CHANNEL)[keyof typeof PAY_CONSTANTS.CHANNEL];

/** 交易状态类型 */
export type TradeState =
  (typeof PAY_CONSTANTS.STATUS)[keyof typeof PAY_CONSTANTS.STATUS];

/** 发货状态类型 */
export type DeliveryStatus =
  (typeof PAY_CONSTANTS.DELIVERY)[keyof typeof PAY_CONSTANTS.DELIVERY];
