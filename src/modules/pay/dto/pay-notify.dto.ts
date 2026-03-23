import {
  IsString,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 微信支付回调通知 Resource DTO
 */
class WechatPayNotifyResourceDto {
  @ApiPropertyOptional({ description: '密文' })
  @IsString()
  @IsOptional()
  ciphertext?: string;

  @ApiPropertyOptional({ description: '随机字符串' })
  @IsString()
  @IsOptional()
  nonce?: string;

  @ApiPropertyOptional({ description: '关联数据' })
  @IsString()
  @IsOptional()
  associatedData?: string;
}

/**
 * 微信支付回调通知 DTO
 */
export class WechatPayNotifyDto {
  @ApiPropertyOptional({ description: '状态码' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: '消息' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: '商户订单号' })
  @IsString()
  @IsOptional()
  outTradeNo?: string;

  @ApiPropertyOptional({ description: '微信交易号' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ description: '交易状态' })
  @IsString()
  @IsOptional()
  tradeState?: string;

  @ApiPropertyOptional({ description: '支付成功时间' })
  @IsString()
  @IsOptional()
  successTime?: string;

  @ApiPropertyOptional({ description: '加密资源对象' })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => WechatPayNotifyResourceDto)
  resource?: WechatPayNotifyResourceDto;
}

/**
 * 支付宝支付回调通知 DTO
 */
export class AlipayPayNotifyDto {
  @ApiPropertyOptional({
    description: '支付宝分配给商户的 AppId',
    name: 'app_id',
  })
  @IsString()
  @IsOptional()
  app_id?: string;

  @ApiPropertyOptional({ description: '商户订单号', name: 'out_trade_no' })
  @IsString()
  @IsOptional()
  out_trade_no?: string;

  @ApiPropertyOptional({ description: '支付宝交易号', name: 'trade_no' })
  @IsString()
  @IsOptional()
  trade_no?: string;

  @ApiPropertyOptional({ description: '交易状态', name: 'trade_status' })
  @IsString()
  @IsOptional()
  trade_status?: string;

  @ApiPropertyOptional({ description: '交易支付时间', name: 'gmt_payment' })
  @IsString()
  @IsOptional()
  gmt_payment?: string;

  @ApiPropertyOptional({ description: '订单总金额', name: 'total_amount' })
  @IsString()
  @IsOptional()
  total_amount?: string;

  @ApiPropertyOptional({ description: '买家支付宝用户号', name: 'buyer_id' })
  @IsString()
  @IsOptional()
  buyer_id?: string;

  @ApiPropertyOptional({
    description: '买家支付宝账号',
    name: 'buyer_logon_id',
  })
  @IsString()
  @IsOptional()
  buyer_logon_id?: string;

  @ApiPropertyOptional({ description: '卖家支付宝用户号', name: 'seller_id' })
  @IsString()
  @IsOptional()
  seller_id?: string;

  [key: string]: any;
}
