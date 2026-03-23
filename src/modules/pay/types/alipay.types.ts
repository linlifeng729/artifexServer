/**
 * 支付宝类型定义
 * 包含支付宝支付相关的类型定义（支付宝 API 原始字段）
 */

/**
 * 支付宝生成支付表单参数
 */
export interface AlipayGeneratePayFormParams {
  /** 支付宝接口类型（如 alipay.trade.page.pay、alipay.trade.wap.pay） */
  method: string;
  /** 商户订单号 */
  outTradeNo: string;
  /** 总金额（单位：元） */
  totalAmount: number;
  /** 商品名称 */
  subject: string;
  /** 产品码（当面付为 FAST_INSTANT_TRADE_PAY） */
  productCode: string;
  /** 通知地址 */
  notifyUrl: string;
  /** 返回地址 */
  returnUrl?: string;
}

/**
 * 支付宝创建订单参数
 */
export interface AlipayCreateOrderParams {
  /** 支付宝接口类型 */
  method: string;
  /** 商户订单号 */
  outTradeNo: string;
  /** 总金额（单位：元） */
  totalAmount: number;
  /** 商品名称 */
  subject: string;
  /** 返回地址 */
  returnUrl: string;
  /** 通知地址 */
  notifyUrl: string;
}

/**
 * 支付宝回调通知参数
 */
export interface AlipayNotifyParams {
  app_id?: string;
  out_trade_no?: string;
  trade_status?: string;
  gmt_payment?: string;
  trade_no?: string;
  total_amount?: string;
  buyer_id?: string;
  buyer_logon_id?: string;
  seller_id?: string;
  [key: string]: any;
}

/**
 * 支付宝回调验签参数
 */
export type AlipayVerifySignParams = Record<string, any>;
