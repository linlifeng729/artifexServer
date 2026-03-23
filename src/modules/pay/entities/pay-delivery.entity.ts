import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PAY_CONSTANTS } from '@/modules/pay/constants';

/**
 * 支付发货记录实体
 * 用于记录发货状态，防止重复发货
 */
@Entity('pay_delivery')
export class PayDelivery {
  @PrimaryGeneratedColumn({ comment: '发货记录ID' })
  id: number;

  @Column({
    name: 'order_id',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.OUT_TRADE_NO_MAX_LENGTH,
    unique: true,
    nullable: false,
    comment: '商户订单号',
  })
  orderId: string;

  @Column({
    name: 'user_id',
    type: 'int',
    nullable: false,
    comment: '用户ID',
  })
  userId: number;

  @Column({
    name: 'goods_id',
    type: 'int',
    nullable: false,
    comment: '商品ID',
  })
  goodsId: number;

  @Column({
    name: 'delivery_status',
    type: 'tinyint',
    default: PAY_CONSTANTS.DELIVERY.NOT_DELIVERED,
    comment: '发货状态：0-未发货，1-已发货，2-发货失败',
  })
  deliveryStatus: number;

  @Column({
    name: 'delivery_time',
    type: 'timestamp',
    nullable: true,
    comment: '发货时间',
  })
  deliveryTime: Date | null;

  @Column({
    name: 'delivery_message',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
    nullable: true,
    comment: '发货结果信息',
  })
  deliveryMessage: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: '更新时间',
  })
  updatedAt: Date;
}
