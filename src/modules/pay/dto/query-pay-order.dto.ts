import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import {
  PAGINATION_CONSTRAINTS,
  TRADE_STATE,
  PAY_CHANNEL,
} from '@/modules/pay/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 支付订单查询参数 DTO
 */
export class QueryPayOrderDto {
  @ApiPropertyOptional({
    description: '页码',
    default: PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: '页码最小为1' })
  page?: number = PAGINATION_CONSTRAINTS.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: '每页数量',
    default: PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: '每页数量最小为1' })
  @Max(PAGINATION_CONSTRAINTS.MAX_LIMIT, {
    message: `每页数量最大为${PAGINATION_CONSTRAINTS.MAX_LIMIT}`,
  })
  limit?: number = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: '交易状态',
    enum: Object.values(TRADE_STATE),
  })
  @IsOptional()
  @IsEnum(Object.values(TRADE_STATE), {
    message: `交易状态只能是${Object.values(TRADE_STATE).join('或')}`,
  })
  tradeState?: string;

  @ApiPropertyOptional({
    description: '支付渠道',
    enum: Object.values(PAY_CHANNEL),
  })
  @IsOptional()
  @IsEnum(Object.values(PAY_CHANNEL), {
    message: `支付渠道只能是${Object.values(PAY_CHANNEL).join('或')}`,
  })
  payChannel?: string;

  @ApiPropertyOptional({ description: '开始日期（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（YYYY-MM-DD）' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
