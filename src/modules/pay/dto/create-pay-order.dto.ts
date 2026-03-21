import {
  IsString,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';
import {
  PAY_CONSTRAINTS,
  PAY_CHANNEL,
  ALIPAY_ORDER_INTERFACE,
} from '@/modules/pay/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建支付订单请求 DTO
 */
export class CreatePayOrderDto {
  @ApiProperty({
    description: '订单描述',
    maxLength: PAY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
  })
  @IsString({ message: '订单描述必须是字符串' })
  @IsNotEmpty({ message: '订单描述不能为空' })
  @MaxLength(PAY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH, {
    message: `订单描述不能超过${PAY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH}个字符`,
  })
  description: string;

  @ApiProperty({
    description: '订单金额（单位：分）',
    minimum: PAY_CONSTRAINTS.MIN_AMOUNT,
  })
  @IsNumber({}, { message: '订单金额必须是数字' })
  @Min(PAY_CONSTRAINTS.MIN_AMOUNT, { message: '订单金额最小为1分' })
  amount: number;

  @ApiProperty({ description: '商品ID' })
  @IsNumber({}, { message: '商品ID必须是数字' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  goodsId: number;

  @ApiPropertyOptional({ description: '支付成功回调 URL' })
  @IsOptional()
  @IsUrl({}, { message: '回调URL格式不正确' })
  @MaxLength(PAY_CONSTRAINTS.CALLBACK_URL_MAX_LENGTH, {
    message: `回调URL不能超过${PAY_CONSTRAINTS.CALLBACK_URL_MAX_LENGTH}个字符`,
  })
  callbackUrl?: string;

  @ApiPropertyOptional({ description: '应用ID' })
  @IsString({ message: '应用ID必须是字符串' })
  @IsOptional()
  @MaxLength(PAY_CONSTRAINTS.APP_ID_MAX_LENGTH, {
    message: `应用ID不能超过${PAY_CONSTRAINTS.APP_ID_MAX_LENGTH}个字符`,
  })
  appId?: string;

  @ApiPropertyOptional({
    description: '微信用户 openid（公众号/小程序支付必填）',
  })
  @IsOptional()
  @IsString({ message: 'OpenId必须是字符串' })
  openid?: string;

  @ApiPropertyOptional({
    description: '支付渠道',
    enum: Object.values(PAY_CHANNEL),
  })
  @IsOptional()
  @IsEnum(Object.values(PAY_CHANNEL), {
    message: `支付渠道只能是${Object.values(PAY_CHANNEL).join('或')}`,
  })
  payChannel?: string;

  @ApiPropertyOptional({
    description:
      '支付宝接口类型（alipay.trade.page.pay 或 alipay.trade.wap.pay）',
    enum: Object.values(ALIPAY_ORDER_INTERFACE),
    example: 'alipay.trade.page.pay',
  })
  @IsOptional()
  @IsEnum(Object.values(ALIPAY_ORDER_INTERFACE), {
    message: `支付宝接口类型只能是 ${Object.values(ALIPAY_ORDER_INTERFACE).join(' 或 ')}`,
  })
  orderInterface?: string;
}
