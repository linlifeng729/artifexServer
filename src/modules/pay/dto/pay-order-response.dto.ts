import { Expose } from 'class-transformer';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 支付订单响应 DTO
 */
export class PayOrderResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty({ description: '商户订单号' })
  @Expose()
  outTradeNo: string;

  @ApiProperty({ description: '订单金额（单位：分）' })
  @Expose()
  amount: number;

  @ApiProperty({ description: '用户ID' })
  @Expose()
  userId: number;

  @ApiProperty({ description: '商品ID' })
  @Expose()
  goodsId: number;

  @ApiProperty({ description: '商品类型' })
  @Expose()
  goodsType: string;

  @ApiProperty({ description: '交易状态', nullable: true })
  @Expose()
  tradeState: string | null;

  @ApiProperty({ description: '支付成功时间', nullable: true })
  @Expose()
  successTime: string | null;

  @ApiProperty({ description: '第三方交易号', nullable: true })
  @Expose()
  transactionId: string | null;

  @ApiProperty({ description: '支付渠道' })
  @Expose()
  payChannel: string;

  @ApiProperty({ description: '订单描述', nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ description: '回调URL', nullable: true })
  @Expose()
  callbackUrl: string | null;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  @Expose()
  updatedAt: Date;

  /**
   * 从实体转换为响应 DTO
   */
  static fromEntity(entity: PayOrder): PayOrderResponseDto {
    const dto = new PayOrderResponseDto();
    dto.id = entity.id;
    dto.outTradeNo = entity.outTradeNo;
    dto.amount = entity.amount;
    dto.userId = entity.userId;
    dto.goodsId = entity.goodsId;
    dto.goodsType = entity.goodsType;
    dto.tradeState = entity.tradeState;
    dto.successTime = entity.successTime;
    dto.transactionId = entity.transactionId;
    dto.payChannel = entity.payChannel;
    dto.description = entity.description;
    dto.callbackUrl = entity.callbackUrl;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
