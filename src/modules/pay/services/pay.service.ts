import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { PayDelivery } from '@/modules/pay/entities/pay-delivery.entity';
import { CreatePayOrderDto } from '@/modules/pay/dto/create-pay-order.dto';
import { QueryPayOrderDto } from '@/modules/pay/dto/query-pay-order.dto';
import { PayOrderResponseDto } from '@/modules/pay/dto/pay-order-response.dto';
import { AlipayService } from './alipay.service';
import { WechatPayService } from './wechat-pay.service';
import { ICrypto } from '@/common/utils/crypto';
import { LoggingService } from '@/common/services/logging.service';
import {
  PAY_CHANNEL,
  TRADE_STATE,
  DELIVERY_STATUS,
  PAGINATION_CONSTRAINTS,
} from '@/modules/pay/constants';

/** 支付服务类 - 处理支付订单和发货相关业务逻辑 */
@Injectable()
export class PayService {
  constructor(
    @InjectRepository(PayOrder)
    private readonly payOrderRepository: Repository<PayOrder>,
    @InjectRepository(PayDelivery)
    private readonly payDeliveryRepository: Repository<PayDelivery>,
    private readonly alipayService: AlipayService,
    private readonly wechatPayService: WechatPayService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * 创建支付订单并获取支付参数
   * @param userId 用户ID
   * @param createPayOrderDto 创建订单 DTO
   * @returns 支付参数
   */
  async createPayOrder(
    userId: number,
    createPayOrderDto: CreatePayOrderDto,
  ): Promise<{
    outTradeNo: string;
    paymentData: any;
  }> {
    // 生成商户订单号
    const outTradeNo = ICrypto.generateRandomString(32);

    // 创建订单记录
    const payOrder = this.payOrderRepository.create({
      outTradeNo,
      amount: createPayOrderDto.amount,
      userId,
      goodsId: createPayOrderDto.goodsId,
      payChannel: createPayOrderDto.payChannel || PAY_CHANNEL.ALIPAY,
      appId: createPayOrderDto.appId,
      description: createPayOrderDto.description,
      callbackUrl: createPayOrderDto.callbackUrl,
    });

    await this.payOrderRepository.save(payOrder);

    // 获取通知地址
    const apiBaseUrl = this.configService.get<string>('app.apiBaseUrl') ?? '';
    const notifyUrl = `${apiBaseUrl}/api/pay/notify`;

    let paymentData: any;

    // 根据支付渠道调用对应的支付接口
    switch (createPayOrderDto.payChannel) {
      case PAY_CHANNEL.ALIPAY:
        paymentData = await this.createAlipayOrder(
          createPayOrderDto.orderInterface!,
          outTradeNo,
          createPayOrderDto.amount / 100, // 转换为元
          createPayOrderDto.description,
          createPayOrderDto.callbackUrl ?? '',
          notifyUrl,
        );
        break;

      case PAY_CHANNEL.WECHAT_PAY:
        paymentData = await this.createWechatPayOrder(
          outTradeNo,
          createPayOrderDto.amount,
          createPayOrderDto.description,
          createPayOrderDto.callbackUrl ?? '',
          notifyUrl,
          createPayOrderDto.orderInterface!,
        );
        break;

      case PAY_CHANNEL.WECHAT_MP:
      case PAY_CHANNEL.WECHAT_OA:
        if (!createPayOrderDto.openid) {
          throw new BadRequestException('缺少 OpenId 参数');
        }
        paymentData = await this.createWechatPayOrder(
          outTradeNo,
          createPayOrderDto.amount,
          createPayOrderDto.description,
          createPayOrderDto.callbackUrl ?? '',
          notifyUrl,
          createPayOrderDto.orderInterface!,
          createPayOrderDto.openid,
        );
        break;

      default:
        throw new BadRequestException('不支持的支付渠道');
    }

    return { outTradeNo, paymentData };
  }

  /**
   * 创建支付宝订单
   */
  private async createAlipayOrder(
    method: string,
    outTradeNo: string,
    totalAmount: number,
    subject: string,
    returnUrl: string,
    notifyUrl: string,
  ): Promise<string> {
    const productCode = 'FAST_INSTANT_TRADE_PAY';

    return await this.alipayService.generatePayForm(
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
   * 创建微信支付订单
   */
  private async createWechatPayOrder(
    outTradeNo: string,
    amount: number,
    description: string,
    returnUrl: string,
    notifyUrl: string,
    orderInterface: string,
    openid?: string,
  ): Promise<any> {
    const appId = this.configService.get<string>('wechatPay.appId') ?? '';

    if (orderInterface === 'native') {
      // Native 支付
      const codeUrl = await this.wechatPayService.unifiedOrderNative(
        appId,
        outTradeNo,
        description,
        amount,
        notifyUrl,
      );
      return { codeUrl };
    } else {
      // JSAPI 支付
      if (!openid) {
        throw new BadRequestException('JSAPI 支付需要 OpenId');
      }
      const prepayId = await this.wechatPayService.unifiedOrderJsapi(
        appId,
        outTradeNo,
        description,
        amount,
        notifyUrl,
        openid,
      );

      return await this.wechatPayService.generateJsapiPayParams(
        appId,
        prepayId,
        returnUrl,
      );
    }
  }

  /**
   * 处理支付宝支付回调通知
   */
  async handleAlipayNotify(params: Record<string, any>): Promise<boolean> {
    // 验签
    if (!this.alipayService.verifyNotifySign(params)) {
      this.loggingService.warn('支付宝回调验签失败', JSON.stringify(params));
      return false;
    }

    const { out_trade_no, trade_status, gmt_payment, trade_no } = params;

    // 更新订单状态
    await this.payOrderRepository.update(
      { outTradeNo: out_trade_no },
      {
        tradeState: trade_status,
        successTime: gmt_payment,
        transactionId: trade_no,
      },
    );

    // 获取订单信息并发货
    const order = await this.payOrderRepository.findOne({
      where: { outTradeNo: out_trade_no },
    });

    if (order) {
      await this.deliverGoods(order);
    }

    return true;
  }

  /**
   * 处理微信支付回调通知
   */
  async handleWechatPayNotify(body: Record<string, any>): Promise<boolean> {
    try {
      const { resource } = body;

      if (!resource) {
        throw new BadRequestException('无效的支付通知');
      }

      // 解密通知数据
      const notifyData = this.wechatPayService.decryptNotifyData<{
        out_trade_no: string;
        transaction_id: string;
        trade_state: string;
        success_time: string;
      }>(resource.ciphertext, resource.nonce, resource.associated_data);

      // 只处理支付成功的订单
      if (notifyData.trade_state !== 'SUCCESS') {
        this.loggingService.warn(
          '微信支付状态不是成功',
          JSON.stringify(notifyData),
        );
        return false;
      }

      // 更新订单状态
      await this.payOrderRepository.update(
        { outTradeNo: notifyData.out_trade_no },
        {
          tradeState: TRADE_STATE.TRADE_SUCCESS,
          successTime: notifyData.success_time,
          transactionId: notifyData.transaction_id,
        },
      );

      // 获取订单信息并发货
      const order = await this.payOrderRepository.findOne({
        where: { outTradeNo: notifyData.out_trade_no },
      });

      if (order) {
        await this.deliverGoods(order);
      }

      return true;
    } catch (error) {
      this.loggingService.error('处理微信支付通知失败', error.message);
      throw new BadRequestException('支付通知处理失败');
    }
  }

  /**
   * 发货处理
   * 根据商品类型调用对应的发货处理逻辑
   */
  private async deliverGoods(order: PayOrder): Promise<void> {
    // 检查是否已发货
    const existingDelivery = await this.payDeliveryRepository.findOne({
      where: { orderId: order.outTradeNo },
    });

    if (existingDelivery) {
      this.loggingService.warn('订单已发货，跳过', order.outTradeNo);
      return;
    }

    // 创建发货记录
    const delivery = this.payDeliveryRepository.create({
      orderId: order.outTradeNo,
      userId: order.userId,
      goodsId: order.goodsId,
      deliveryStatus: DELIVERY_STATUS.NOT_DELIVERED,
    });

    await this.payDeliveryRepository.save(delivery);

    try {
      // 更新发货状态
      await this.payDeliveryRepository.update(
        { orderId: order.outTradeNo },
        {
          deliveryStatus: DELIVERY_STATUS.DELIVERED,
          deliveryTime: new Date(),
          deliveryMessage: '发货成功',
        },
      );
    } catch (error) {
      // 更新发货失败状态
      await this.payDeliveryRepository.update(
        { orderId: order.outTradeNo },
        {
          deliveryStatus: DELIVERY_STATUS.DELIVERY_FAILED,
          deliveryMessage: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * 获取用户支付订单列表
   */
  async getUserPayOrders(
    userId: number,
    queryDto: QueryPayOrderDto,
  ): Promise<{
    list: PayOrderResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
      limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
      tradeState,
      payChannel,
      startDate,
      endDate,
    } = queryDto;

    const skip = (page - 1) * limit;

    const queryBuilder = this.payOrderRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId });

    if (tradeState) {
      queryBuilder.andWhere('order.tradeState = :tradeState', { tradeState });
    }

    if (payChannel) {
      queryBuilder.andWhere('order.payChannel = :payChannel', { payChannel });
    }

    if (startDate) {
      queryBuilder.andWhere('order.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('order.createdAt <= :endDate', { endDate });
    }

    queryBuilder.orderBy('order.createdAt', 'DESC').skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();

    const list = orders.map((order) => PayOrderResponseDto.fromEntity(order));

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(outTradeNo: string, userId?: number): Promise<PayOrder> {
    const where: any = { outTradeNo };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.payOrderRepository.findOne({ where });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  /**
   * 验证微信服务器签名
   */
  verifyWechatSignature(
    signature: string,
    timestamp: string,
    nonce: string,
    echostr: string,
  ): boolean {
    // TODO: 注入 WechatOAService 并调用验证方法
    return true;
  }
}
