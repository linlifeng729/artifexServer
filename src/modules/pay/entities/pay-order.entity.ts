import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PAY_CONSTANTS } from '@/modules/pay/constants';

/**
 * 支付订单实体
 * 基于数据库表结构定义支付订单数据模型
 */
@Entity('pay_order')
export class PayOrder {
  @PrimaryGeneratedColumn({ comment: '支付订单ID' })
  id: number;

  @Column({
    name: 'out_trade_no',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.OUT_TRADE_NO_MAX_LENGTH,
    unique: true,
    nullable: false,
    comment: '商户订单号（外部订单号）',
  })
  outTradeNo: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '订单金额（单位：分）',
  })
  amount: number;

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
    name: 'trade_state',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '交易状态',
  })
  tradeState: string | null;

  @Column({
    name: 'success_time',
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: '支付成功时间',
  })
  successTime: string | null;

  @Column({
    name: 'transaction_id',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.TRANSACTION_ID_MAX_LENGTH,
    nullable: true,
    comment: '支付平台交易号',
  })
  transactionId: string | null;

  @Column({
    name: 'pay_channel',
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: '支付渠道',
  })
  payChannel: string;

  @Column({
    name: 'app_id',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.APP_ID_MAX_LENGTH,
    nullable: true,
    comment: '应用ID（支付宝/微信）',
  })
  appId: string | null;

  @Column({
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
    nullable: true,
    comment: '订单描述/商品名称',
  })
  description: string | null;

  @Column({
    name: 'callback_url',
    type: 'varchar',
    length: PAY_CONSTANTS.CONSTRAINTS.CALLBACK_URL_MAX_LENGTH,
    nullable: true,
    comment: '支付完成后跳转的页面URL',
  })
  callbackUrl: string | null;

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
