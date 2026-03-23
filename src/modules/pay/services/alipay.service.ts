import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AlipaySdk } from 'alipay-sdk';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { LoggingService } from '@/common/services/logging.service';
import { DistributedLockService } from '@/common/services/distributed-lock.service';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { PayDelivery } from '@/modules/pay/entities/pay-delivery.entity';
import { PAY_CONSTANTS } from '@/modules/pay/constants';

@Injectable()
export class AlipayService {
  private alipaySdk: AlipaySdk;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly distributedLockService: DistributedLockService,
    private readonly dataSource: DataSource,
  ) {
    const appId = this.configService.get<string>('ALIPAY_APP_ID');
    const privateKey = this.configService.get<string>('ALIPAY_PRIVATE_KEY');
    const alipayPublicKey = this.configService.get<string>(
      'ALIPAY_ALIPAY_PUBLIC_KEY',
    );

    if (!appId || !privateKey || !alipayPublicKey) {
      throw new InternalServerErrorException('支付宝配置错误，请检查环境变量');
    }

    this.alipaySdk = new AlipaySdk({
      appId,
      privateKey,
      alipayPublicKey,
    });
  }

  /**
   * 生成支付宝支付表单
   * @param method 支付宝接口类型（如 alipay.trade.page.pay、alipay.trade.wap.pay）
   * @param outTradeNo 商户订单号
   * @param totalAmount 总金额（单位：元）
   * @param subject 商品名称
   * @param productCode 产品码（当面付为 FAST_INSTANT_TRADE_PAY）
   * @param notifyUrl 通知地址
   * @param returnUrl 返回地址
   * @returns 支付表单 HTML
   */
  async generatePayForm(
    method: string,
    outTradeNo: string,
    totalAmount: number,
    subject: string,
    productCode: string,
    notifyUrl: string,
    returnUrl?: string,
  ): Promise<string> {
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
   * 创建支付宝订单并返回支付表单
   */
  async createAlipayOrder(
    method: string,
    outTradeNo: string,
    totalAmount: number,
    subject: string,
    returnUrl: string,
    notifyUrl: string,
  ): Promise<string> {
    const productCode = 'FAST_INSTANT_TRADE_PAY';
    return this.generatePayForm(
      method,
      outTradeNo,
      totalAmount,
      subject,
      productCode,
      notifyUrl,
      returnUrl,
    );
  }

  /**
   * 处理支付宝支付回调通知
   * 使用分布式锁确保幂等性，防止重复处理
   */
  async handleAlipayNotify(params: Record<string, any>): Promise<boolean> {
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
   * 发货处理（在事务中执行）
   */
  private async deliverGoodsWithTransaction(
    manager: any,
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
   * 验证支付宝回调通知签名
   */
  verifyNotifySign(params: Record<string, any>): boolean {
    try {
      return this.alipaySdk.checkNotifySignV2(params);
    } catch (error) {
      return false;
    }
  }
}
