import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { CreatePayOrderDto } from '@/modules/pay/dto/create-pay-order.dto';
import { AlipayService } from './alipay.service';
import { WechatPayService } from './wechat-pay.service';
import { ICrypto } from '@/common/utils/crypto';
import { LoggingService } from '@/common/services/logging.service';
import { DistributedLockService } from '@/common/services/distributed-lock.service';
import { PAY_CONSTANTS } from '@/modules/pay/constants';

@Injectable()
export class PayService {
  constructor(
    @InjectRepository(PayOrder)
    private readonly payOrderRepository: Repository<PayOrder>,
    private readonly alipayService: AlipayService,
    private readonly wechatPayService: WechatPayService,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
    private readonly distributedLockService: DistributedLockService,
  ) {}

  /**
   * 创建支付订单并获取支付参数
   * 先落库再调支付平台，保证订单记录与支付行为一致
   */
  async createPayOrder(
    userId: number,
    createPayOrderDto: CreatePayOrderDto,
  ): Promise<{
    outTradeNo: string;
    paymentLink: any;
  }> {
    const startTime = Date.now();

    // 生成商户侧订单号（全局唯一，支付平台以此识别订单）
    const outTradeNo = ICrypto.generateRandomString(
      PAY_CONSTANTS.CONSTRAINTS.OUT_TRADE_NO_MAX_LENGTH,
    );

    this.loggingService.log(
      `[创建订单] 开始创建订单 - outTradeNo: ${outTradeNo}, userId: ${userId}, amount: ${createPayOrderDto.amount}`,
    );

    // 使用分布式锁防止同一 outTradeNo 并发创建（幂等性保障）
    const lockKey = `pay:order:create:${outTradeNo}`;

    return await this.distributedLockService.withLock(
      lockKey,
      async () => {
        // 再次查询确认订单不存在（双重保障）
        const existingOrder = await this.payOrderRepository.findOne({
          where: { outTradeNo },
        });

        if (existingOrder) {
          this.loggingService.warn(
            `[创建订单] 订单已存在，跳过创建 - outTradeNo: ${outTradeNo}`,
          );
          throw new BadRequestException('订单已存在，请勿重复创建');
        }

        // 构建并持久化订单记录
        const payOrder = this.payOrderRepository.create({
          outTradeNo,
          amount: createPayOrderDto.amount,
          userId,
          goodsId: createPayOrderDto.goodsId,
          payChannel: createPayOrderDto.payChannel,
          appId: createPayOrderDto.appId,
          description: createPayOrderDto.description,
          callbackUrl: createPayOrderDto.callbackUrl,
        });

        await this.payOrderRepository.save(payOrder);

        // 构造回调地址，支付平台通知会推送到此接口
        const notifyUrl = `${PAY_CONSTANTS.DOMAIN}/api/pay/notify`;

        let paymentLink: any;

        // 根据支付渠道分发到对应支付服务，调用统一下单接口获取支付参数
        switch (createPayOrderDto.payChannel) {
          // 支付宝扫码 / PC 支付：直接拿到支付表单 HTML，前端提交即可
          case PAY_CONSTANTS.CHANNEL.ALIPAY:
          case PAY_CONSTANTS.CHANNEL.ALIPAY_H5: {
            const alipayMethod =
              createPayOrderDto.payChannel === PAY_CONSTANTS.CHANNEL.ALIPAY_H5
                ? PAY_CONSTANTS.ALIPAY_INTERFACE.WAP_PAY
                : PAY_CONSTANTS.ALIPAY_INTERFACE.FACE_TO_FACE_PAY;

            // amount 单位为分，支付宝以元为单位，需除以 100 转换
            paymentLink = await this.alipayService.createAlipayOrder({
              method: alipayMethod,
              outTradeNo,
              totalAmount: createPayOrderDto.amount / 100,
              subject: createPayOrderDto.description,
              returnUrl: createPayOrderDto.callbackUrl ?? '',
              notifyUrl,
            });
            break;
          }

          // 微信 Native 支付：返回二维码链接 code_url，前端生成二维码扫码支付
          case PAY_CONSTANTS.CHANNEL.WECHAT_PAY: {
            paymentLink = await this.wechatPayService.unifiedOrderNative(
              createPayOrderDto.appId,
              outTradeNo,
              createPayOrderDto.description,
              createPayOrderDto.amount,
              notifyUrl,
            );
            break;
          }

          // 微信小程序 / 公众号 JSAPI 支付：需 openid，分两步获取调起参数
          case PAY_CONSTANTS.CHANNEL.WECHAT_MP:
          case PAY_CONSTANTS.CHANNEL.WECHAT_OA: {
            if (!createPayOrderDto.openid) {
              throw new BadRequestException('缺少 OpenId 参数');
            }
            const jsapiAppId =
              this.configService.get<string>('wechatPay.appId') ?? '';
            // 第一步：统一下单获取 prepay_id
            const prepayId = await this.wechatPayService.unifiedOrderJsapi(
              jsapiAppId,
              outTradeNo,
              createPayOrderDto.description,
              createPayOrderDto.amount,
              notifyUrl,
              createPayOrderDto.openid,
            );
            // 第二步：用 prepay_id 生成调起微信支付的签名参数
            paymentLink = await this.wechatPayService.generateJsapiPayParams(
              jsapiAppId,
              prepayId,
              createPayOrderDto.callbackUrl,
            );
            break;
          }

          default:
            throw new BadRequestException('不支持的支付渠道');
        }

        this.loggingService.log(
          `[创建订单] 订单创建成功 - outTradeNo: ${outTradeNo}, 耗时: ${Date.now() - startTime}ms`,
        );

        return { outTradeNo, paymentLink };
      },
      60000, // 60s 超时，防止死锁长期占用锁
    );
  }
}
