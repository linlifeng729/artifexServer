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
  @ApiPropertyOptional({ description: '支付宝分配给商户的 AppId' })
  @IsString()
  @IsOptional()
  appId?: string;

  @ApiPropertyOptional({ description: '商户订单号' })
  @IsString()
  @IsOptional()
  outTradeNo?: string;

  @ApiPropertyOptional({ description: '支付宝交易号' })
  @IsString()
  @IsOptional()
  tradeNo?: string;

  @ApiPropertyOptional({ description: '交易状态' })
  @IsString()
  @IsOptional()
  tradeStatus?: string;

  @ApiPropertyOptional({ description: '交易支付时间' })
  @IsString()
  @IsOptional()
  gmtPayment?: string;

  @ApiPropertyOptional({ description: '订单总金额' })
  @IsString()
  @IsOptional()
  totalAmount?: string;

  @ApiPropertyOptional({ description: '买家支付宝用户号' })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiPropertyOptional({ description: '买家支付宝账号' })
  @IsString()
  @IsOptional()
  buyerLogonId?: string;

  @ApiPropertyOptional({ description: '卖家支付宝用户号' })
  @IsString()
  @IsOptional()
  sellerId?: string;
}
