/**
 * 支付宝类型定义
 * 包含支付宝支付相关的类型定义（支付宝 API 原始字段）
 */

/**
 * 支付宝生成支付表单参数
 */
export interface AlipayGeneratePayFormParams {
  method: string;
  outTradeNo: string;
  totalAmount: number;
  subject: string;
  productCode: string;
  notifyUrl: string;
  returnUrl?: string;
}

/**
 * 支付宝创建订单参数
 */
export interface AlipayCreateOrderParams {
  method: string;
  outTradeNo: string;
  totalAmount: number;
  subject: string;
  returnUrl: string;
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
