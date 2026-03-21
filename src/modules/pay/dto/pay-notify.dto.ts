import { Expose } from 'class-transformer';
import { IsString, IsOptional } from 'class-validator';

/**
 * 微信支付回调通知 DTO
 */
export class WechatPayNotifyDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  outTradeNo?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  tradeState?: string;

  @IsString()
  @IsOptional()
  successTime?: string;

  @IsOptional()
  resource?: {
    ciphertext?: string;
    nonce?: string;
    associatedData?: string;
  };
}

/**
 * 支付宝支付回调通知 DTO
 */
export class AlipayPayNotifyDto {
  @IsString()
  @IsOptional()
  appId?: string;

  @IsString()
  @IsOptional()
  outTradeNo?: string;

  @IsString()
  @IsOptional()
  tradeNo?: string;

  @IsString()
  @IsOptional()
  tradeStatus?: string;

  @IsString()
  @IsOptional()
  gmtPayment?: string;

  @IsOptional()
  totalAmount?: string;
}
