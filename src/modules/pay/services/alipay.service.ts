import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AlipaySdk } from 'alipay-sdk';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { LoggingService } from '@/common/services/logging.service';
import { DistributedLockService } from '@/common/services/distributed-lock.service';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { PayDelivery } from '@/modules/pay/entities/pay-delivery.entity';
import { PAY_CONSTANTS } from '@/modules/pay/constants';
import type {
  AlipayGeneratePayFormParams,
  AlipayCreateOrderParams,
  AlipayNotifyParams,
  AlipayVerifySignParams,
} from '@/modules/pay/types';

/**
 * 支付宝支付服务
 * 提供支付宝支付的表单生成、订单创建、回调处理等功能
 */
@Injectable()
export class AlipayService {
  private readonly alipaySdk: AlipaySdk;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly distributedLockService: DistributedLockService,
    private readonly dataSource: DataSource,
  ) {
    const config = this.getAlipayConfig();
    this.alipaySdk = config.alipaySdk;
  }

  /**
   * @description 获取支付宝配置
   * @returns {Object} 包含 alipaySdk 的配置对象
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getAlipayConfig(): { alipaySdk: AlipaySdk } {
    const requiredConfigs = [
      'ALIPAY_APP_ID',
      'ALIPAY_PRIVATE_KEY',
      'ALIPAY_ALIPAY_PUBLIC_KEY',
    ];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      this.loggingService.error(
        `[支付宝] 配置缺失: ${missingConfigs.join(', ')}`,
      );
      throw new InternalServerErrorException('支付宝配置不完整');
    }

    return {
      alipaySdk: new AlipaySdk({
        appId: this.configService.get<string>('ALIPAY_APP_ID')!,
        privateKey: this.configService.get<string>('ALIPAY_PRIVATE_KEY')!,
        alipayPublicKey: this.configService.get<string>('ALIPAY_ALIPAY_PUBLIC_KEY')!,
      }),
    };
  }

  /**
   * @description 生成支付宝支付表单
   * @param {AlipayGeneratePayFormParams} params 支付参数，包含订单号、金额、商品信息等
   * @returns {Promise<string>} 支付表单 HTML 内容
   */
  async generatePayForm(params: AlipayGeneratePayFormParams): Promise<string> {
    const {
      method,
      outTradeNo,
      totalAmount,
      subject,
      productCode,
      notifyUrl,
      returnUrl,
    } = params;
    try {
      const result = await this.alipaySdk.pageExec(method, {
        return_url: returnUrl,
        notify_url: notifyUrl,
        bizContent: {
          out_trade_no: outTradeNo,
          total_amount: totalAmount,
          subject: subject,
          product_code: productCode,
          quit_url: returnUrl,
        },
      });

      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `支付宝支付表单生成失败: ${error.message}`,
      );
    }
  }

  /**
   * @description 创建支付宝订单并返回支付表单
   * @param {AlipayCreateOrderParams} params 订单参数，包含订单号、金额、商品信息等
   * @returns {Promise<string>} 支付表单 HTML 内容
   */
  async createAlipayOrder(params: AlipayCreateOrderParams): Promise<string> {
    const productCode = 'FAST_INSTANT_TRADE_PAY';
    return this.generatePayForm({
      ...params,
      productCode,
    });
  }

  /**
   * @description 处理支付宝支付回调通知，使用分布式锁确保幂等性，防止重复处理
   * @param {AlipayNotifyParams} params 支付宝回调参数，包含交易状态、交易号等
   * @returns {Promise<boolean>} 是否处理成功
   */
  async handleAlipayNotify(params: AlipayNotifyParams): Promise<boolean> {
    const { out_trade_no, trade_status, gmt_payment, trade_no } = params;

    this.loggingService.log(
      `[支付宝回调] 收到回调通知 - outTradeNo: ${out_trade_no}, tradeStatus: ${trade_status}`,
    );

    if (!this.verifyNotifySign(params)) {
      this.loggingService.warn(
        `[支付宝回调] 验签失败 - outTradeNo: ${out_trade_no}`,
      );
      return false;
    }

    const lockKey = `${PAY_CONSTANTS.LOCK_KEYS.ORDER_NOTIFY}${out_trade_no}`;

    return await this.distributedLockService.withLock(
      lockKey,
      async () => {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          const existingOrder = await queryRunner.manager.findOne(PayOrder, {
            where: { outTradeNo: out_trade_no },
          });

          if (!existingOrder) {
            this.loggingService.warn(
              `[支付宝回调] 订单不存在 - outTradeNo: ${out_trade_no}`,
            );
            throw new NotFoundException('订单不存在');
          }

          if (
            existingOrder.tradeState === PAY_CONSTANTS.STATUS.TRADE_SUCCESS ||
            existingOrder.tradeState === PAY_CONSTANTS.STATUS.TRADE_FINISHED
          ) {
            this.loggingService.warn(
              `[支付宝回调] 订单已处理，跳过 - outTradeNo: ${out_trade_no}`,
            );
            await queryRunner.rollbackTransaction();
            return true;
          }

          await queryRunner.manager.update(
            PayOrder,
            { outTradeNo: out_trade_no },
            {
              tradeState: trade_status,
              successTime: gmt_payment,
              transactionId: trade_no,
            },
          );

          this.loggingService.log(
            `[支付宝回调] 订单状态更新成功 - outTradeNo: ${out_trade_no}, transactionId: ${trade_no}`,
          );

          const order = await queryRunner.manager.findOne(PayOrder, {
            where: { outTradeNo: out_trade_no },
          });

          if (order) {
            await this.deliverGoodsWithTransaction(queryRunner.manager, order);
          }

          await queryRunner.commitTransaction();

          this.loggingService.log(
            `[支付宝回调] 回调处理完成 - outTradeNo: ${out_trade_no}`,
          );

          return true;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          this.loggingService.error(
            `[支付宝回调] 处理失败 - outTradeNo: ${out_trade_no}, error: ${error.message}`,
          );
          throw error;
        } finally {
          await queryRunner.release();
        }
      },
      30000,
    );
  }

  /**
   * @description 发货处理（在事务中执行），更新发货状态并记录发货信息
   * @param {EntityManager} manager 事务管理器
   * @param {PayOrder} order 支付订单
   * @returns {Promise<void>}
   */
  private async deliverGoodsWithTransaction(
    manager: EntityManager,
    order: PayOrder,
  ): Promise<void> {
    const existingDelivery = await manager.findOne(PayDelivery, {
      where: { orderId: order.outTradeNo },
      lock: { mode: 'pessimistic_write' },
    });

    if (existingDelivery) {
      this.loggingService.warn(
        `[发货] 订单已发货，跳过 - outTradeNo: ${order.outTradeNo}`,
      );
      return;
    }

    const delivery = manager.create(PayDelivery, {
      orderId: order.outTradeNo,
      userId: order.userId,
      goodsId: order.goodsId,
      deliveryStatus: PAY_CONSTANTS.DELIVERY.NOT_DELIVERED,
    });

    await manager.save(delivery);

    try {
      await manager.update(
        PayDelivery,
        { orderId: order.outTradeNo },
        {
          deliveryStatus: PAY_CONSTANTS.DELIVERY.DELIVERED,
          deliveryTime: new Date(),
          deliveryMessage: '发货成功',
        },
      );

      this.loggingService.log(
        `[发货] 发货成功 - outTradeNo: ${order.outTradeNo}, goodsId: ${order.goodsId}`,
      );
    } catch (error) {
      await manager.update(
        PayDelivery,
        { orderId: order.outTradeNo },
        {
          deliveryStatus: PAY_CONSTANTS.DELIVERY.DELIVERY_FAILED,
          deliveryMessage: error.message,
        },
      );

      this.loggingService.error(
        `[发货] 发货失败 - outTradeNo: ${order.outTradeNo}, error: ${error.message}`,
      );

      throw error;
    }
  }

  /**
   * @description 验证支付宝回调通知签名
   * @param {AlipayVerifySignParams} params 回调参数
   * @returns {boolean} 验签是否通过
   */
  verifyNotifySign(params: AlipayVerifySignParams): boolean {
    try {
      return this.alipaySdk.checkNotifySignV2(params);
    } catch (error) {
      return false;
    }
  }
}
