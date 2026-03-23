import {
  IsString,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { PAY_CONSTANTS } from '@/modules/pay/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建支付订单请求 DTO
 */
export class CreatePayOrderDto {
  @ApiProperty({
    description: '订单描述',
    maxLength: 255,
  })
  @IsString({ message: '订单描述必须是字符串' })
  @IsNotEmpty({ message: '订单描述不能为空' })
  @MaxLength(255, {
    message: '订单描述不能超过255个字符',
  })
  description: string;

  @ApiProperty({
    description: '订单金额（单位：分）',
    minimum: 1,
  })
  @IsNumber({}, { message: '订单金额必须是数字' })
  @Min(1, { message: '订单金额最小为1分' })
  amount: number;

  @ApiProperty({ description: '商品ID' })
  @IsNumber({}, { message: '商品ID必须是数字' })
  @IsNotEmpty({ message: '商品ID不能为空' })
  goodsId: number;

  @ApiPropertyOptional({ description: '支付成功回调 URL' })
  @IsOptional()
  @IsUrl({}, { message: '回调URL格式不正确' })
  @MaxLength(255, {
    message: '回调URL不能超过255个字符',
  })
  callbackUrl?: string;

  @ApiProperty({ description: '应用ID' })
  @IsString({ message: '应用ID必须是字符串' })
  @IsNotEmpty({ message: '应用ID不能为空' })
  @MaxLength(32, {
    message: '应用ID不能超过32个字符',
  })
  appId: string;

  @ApiPropertyOptional({
    description: '微信用户 openid（公众号/小程序支付必填）',
  })
  @ValidateIf(
    (o) =>
      !o.payChannel ||
      [PAY_CONSTANTS.CHANNEL.WECHAT_MP, PAY_CONSTANTS.CHANNEL.WECHAT_OA].includes(
        o.payChannel,
      ),
  )
  @IsNotEmpty({ message: 'OpenId不能为空' })
  @IsString({ message: 'OpenId必须是字符串' })
  openid?: string;

  @ApiPropertyOptional({
    description: '支付渠道',
    enum: Object.values(PAY_CONSTANTS.CHANNEL),
  })
  @IsOptional()
  @IsEnum(Object.values(PAY_CONSTANTS.CHANNEL), {
    message: `支付渠道只能是${Object.values(PAY_CONSTANTS.CHANNEL).join('或')}`,
  })
  payChannel?: string;
}
