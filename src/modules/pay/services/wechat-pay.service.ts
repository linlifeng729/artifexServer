import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { DataSource } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { ICrypto } from '@/common/utils/crypto';
import { getCurrentTimestamp } from '@/common/utils';
import { LoggingService } from '@/common/services/logging.service';
import { RedisLockService } from '@/common/services/redis-lock.service';
import { PayOrder } from '@/modules/pay/entities/pay-order.entity';
import { PayDelivery } from '@/modules/pay/entities/pay-delivery.entity';
import { PAY_CONSTANTS } from '@/modules/pay/constants';
import type {
  WechatJsapiPayParams,
  WechatPayNotifyData,
} from '@/modules/pay/types';
import * as crypto from 'crypto';

/**
 * 微信支付服务
 * 负责微信支付相关的业务逻辑，包括 Native 支付、JSAPI 支付、回调通知处理和发货管理等
 */
@Injectable()
export class WechatPayService {
  private readonly config: {
    mchId: string;
    notifySecret: string;
    serialNo: string;
    privateKey: crypto.KeyObject;
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly loggingService: LoggingService,
    private readonly distributedLockService: RedisLockService,
    private readonly dataSource: DataSource,
  ) {
    this.config = this.getPayConfig();
  }

  /**
   * @description 获取微信支付配置
   * @returns {Object} 包含 mchId、notifySecret、serialNo、privateKey 的配置对象
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getPayConfig(): {
    mchId: string;
    notifySecret: string;
    serialNo: string;
    privateKey: crypto.KeyObject;
  } {
    const requiredConfigs = [
      'WX_PAY_MCHID',
      'WX_PAY_SERIAL_NO',
      'WX_PAY_NOTIFY_SECRET',
      'WX_PAY_PRIVATE_KEY',
    ];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      this.loggingService.error(
        `[微信支付] 配置缺失: ${missingConfigs.join(', ')}`,
      );
      throw new InternalServerErrorException('微信支付配置不完整');
    }

    return {
      mchId: this.configService.get<string>('WX_PAY_MCHID')!,
      serialNo: this.configService.get<string>('WX_PAY_SERIAL_NO')!,
      notifySecret: this.configService.get<string>('WX_PAY_NOTIFY_SECRET')!,
      privateKey: ICrypto.createPrivateKeyFromBase64(
        this.configService.get<string>('WX_PAY_PRIVATE_KEY')!,
      ),
    };
  }

  /**
   * @description 生成 JSAPI 调起支付签名
   * @param {string} appId 应用ID
   * @param {number} timestamp 时间戳（秒）
   * @param {string} nonceStr 随机字符串
   * @param {string} packageId 预支付ID（格式：prepay_id={prepayId}）
   * @returns {Promise<string>} 返回生成的签名
   */
  private async generateJsapiSignature(
    appId: string,
    timestamp: string,
    nonceStr: string,
    packageId: string,
  ): Promise<string> {
    const message = `${appId}\n${timestamp}\n${nonceStr}\n${packageId}\n`;
    return ICrypto.createSignWithKeyObject(
      message,
      this.config.privateKey,
      'RSA-SHA256',
      'base64',
    );
  }

  /**
   * @description 生成微信支付请求签名
   * @param {string} url 需要签名的 URL 地址
   * @param {string} method 请求方法（GET、POST 等）
   * @param {Object} body 请求体的内容，仅在 POST 请求等包含请求体的情况下使用
   * @returns {string} 返回生成的签名授权信息
   * @example
   * const signature = await this.generateWxPayRequestSignature(url, 'POST', requestParams)
   */
  private generateWxPayRequestSignature(
    url: string,
    method: string,
    body: object,
  ): string {
    // 生成的唯一随机字符串
    const nonceStr = ICrypto.generateRandomString(32);

    // 获取当前时间戳（秒）
    const timestamp = getCurrentTimestamp();

    // 生成待签名的消息字符串
    const message = this.generateWxPaySignatureMessage(
      method,
      url,
      timestamp,
      nonceStr,
      body,
    );

    // 使用 RSA-SHA256 算法对待签名消息进行签名
    const signature = ICrypto.createSignWithKeyObject(
      message,
      this.config.privateKey,
      'RSA-SHA256',
      'base64',
    );

    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.config.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.config.serialNo}",signature="${signature}"`;

    return authorization;
  }

  /**
   * @description 生成微信支付签名消息字符串，用于请求签名
   * @param {string} method 请求方法，'GET', 'POST'
   * @param {string} url 请求的完整 URL，包括协议名、域名和路径
   * @param {string} timestamp 当前时间戳
   * @param {string} nonceStr 随机字符串
   * @param {Object} body 请求体的内容，仅在 POST 请求等包含请求体的情况下使用
   * @returns {string} 生成的签名消息字符串，每个字段之间用换行符分隔
   */
  private generateWxPaySignatureMessage(
    method: string,
    url: string,
    timestamp: string,
    nonceStr: string,
    body: object,
  ): string {
    const parsedUrl = new URL(url);

    let canonicalUrl = parsedUrl.pathname;

    if (parsedUrl.search) {
      canonicalUrl += parsedUrl.search;
    }

    const message = `${method}\n${canonicalUrl}\n${timestamp}\n${nonceStr}\n${body && JSON.stringify(body)}\n`;

    return message;
  }

  /**
   * @description 微信 Native 支付统一下单
   * @param {string} appId 微信应用ID
   * @param {string} outTradeNo 商户订单号
   * @param {string} description 商品描述
   * @param {number} amount 订单金额（单位：分）
   * @param {string} notifyUrl 支付回调通知地址
   * @returns {Promise<string>} 返回支付二维码链接（code_url）
   * @example
   * const codeUrl = await wechatPayService.unifiedOrderNative(appId, outTradeNo, '商品描述', 100, notifyUrl)
   */
  async unifiedOrderNative(
    appId: string,
    outTradeNo: string,
    description: string,
    amount: number,
    notifyUrl: string,
  ): Promise<string> {
    try {
      const url = `${PAY_CONSTANTS.WX_API_CONFIG.MCH_DOMAIN}${PAY_CONSTANTS.WX_PAY_API.NATIVE}`;

      const requestParams = {
        appid: appId,
        mchid: this.config.mchId,
        description,
        out_trade_no: outTradeNo,
        notify_url: notifyUrl,
        amount: {
          total: amount,
        },
      };

      const authorization = await this.generateWxPayRequestSignature(
        url,
        'POST',
        requestParams,
      );

      const response = await firstValueFrom(
        this.httpService.post(url, requestParams, {
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data.code_url;
    } catch (error) {
      throw new InternalServerErrorException(
        `微信Native支付下单失败: ${error.response?.data?.message ?? error.message}`,
      );
    }
  }

  /**
   * @description 微信 JSAPI 支付统一下单
   * @param {string} appId 微信应用ID
   * @param {string} outTradeNo 商户订单号
   * @param {string} description 商品描述
   * @param {number} amount 订单金额（单位：分）
   * @param {string} notifyUrl 支付回调通知地址
   * @param {string} openid 用户openid
   * @returns {Promise<string>} 返回预支付交易会话标识（prepay_id）
   * @example
   * const prepayId = await wechatPayService.unifiedOrderJsapi(appId, outTradeNo, '商品描述', 100, notifyUrl, openid)
   */
  async unifiedOrderJsapi(
    appId: string,
    outTradeNo: string,
    description: string,
    amount: number,
    notifyUrl: string,
    openid: string,
  ): Promise<string> {
    try {
      const url = `${PAY_CONSTANTS.WX_API_CONFIG.MCH_DOMAIN}${PAY_CONSTANTS.WX_PAY_API.JSAPI}`;

      const requestParams = {
        appid: appId,
        mchid: this.config.mchId,
        description,
        out_trade_no: outTradeNo,
        notify_url: notifyUrl,
        amount: {
          total: amount,
        },
        payer: {
          openid,
        },
      };

      const authorization = await this.generateWxPayRequestSignature(
        url,
        'POST',
        requestParams,
      );

      const response = await firstValueFrom(
        this.httpService.post(url, requestParams, {
          headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data.prepay_id;
    } catch (error) {
      throw new InternalServerErrorException(
        `微信JSAPI支付下单失败: ${error.response?.data?.message ?? error.message}`,
      );
    }
  }

  /**
   * @description 生成 JSAPI 调起支付参数
   * @param {string} appId 微信应用ID
   * @param {string} prepayId 预支付交易会话标识
   * @param {string} [callbackUrl] 支付完成后跳转的回调地址（可选）
   * @returns {Promise<Object>} 返回调起支付的参数对象，包含 nonceStr、timestamp、package、signType、paySign、callbackUrl
   * @example
   * const params = await wechatPayService.generateJsapiPayParams(appId, prepayId, 'https://example.com/pay/success')
   */
  async generateJsapiPayParams(
    appId: string,
    prepayId: string,
    callbackUrl?: string,
  ): Promise<WechatJsapiPayParams> {
    const nonceStr = ICrypto.generateRandomString(32);
    const timestamp = `${Math.floor(Date.now() / 1000)}`;
    const packageId = `prepay_id=${prepayId}`;
    const paySign = await this.generateJsapiSignature(
      appId,
      timestamp,
      nonceStr,
      packageId,
    );

    return {
      nonceStr,
      timestamp,
      package: packageId,
      signType: 'RSA',
      paySign,
      callbackUrl,
    };
  }

  /**
   * @description 解密微信支付通知数据
   * @param {string} ciphertext Base64 编码的加密数据
   * @param {string} nonce 加密使用的随机字符串
   * @param {string} associatedData 附加数据
   * @returns {T} 返回解密后的原始数据对象
   * @throws BadRequestException 解密失败时抛出异常
   */
  decryptNotifyData<T = any>(
    ciphertext: string,
    nonce: string,
    associatedData: string,
  ): T {
    try {
      const key = this.config.notifySecret;
      const keyBuffer = Buffer.from(key, 'utf8');
      const nonceBuffer = Buffer.from(nonce, 'utf8');
      const associatedDataBuffer = Buffer.from(associatedData, 'utf8');
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        keyBuffer,
        nonceBuffer,
      );
      decipher.setAuthTag(ciphertextBuffer.slice(-16));
      decipher.setAAD(associatedDataBuffer);

      const decrypted = Buffer.concat([
        decipher.update(ciphertextBuffer.slice(0, -16)),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      throw new BadRequestException('支付通知解密失败');
    }
  }

  /**
   * @description 处理微信支付回调通知
   * @param {Record<string, any>} body 微信支付回调通知的请求体
   * @returns {Promise<boolean>} 返回是否处理成功
   * @throws BadRequestException 无效的支付通知时抛出异常
   * @throws NotFoundException 订单不存在时抛出异常
   */
  async handleWechatPayNotify(body: Record<string, any>): Promise<boolean> {
    try {
      const { resource } = body;

      if (!resource) {
        this.loggingService.warn(
          '[微信回调] 无效的通知数据 - 缺少 resource 字段',
        );
        throw new BadRequestException('无效的支付通知');
      }

      const notifyData = this.decryptNotifyData<WechatPayNotifyData>(
        resource.ciphertext,
        resource.nonce,
        resource.associated_data,
      );

      const { out_trade_no, transaction_id, trade_state, success_time } =
        notifyData;

      this.loggingService.log(
        `[微信回调] 收到回调通知 - outTradeNo: ${out_trade_no}, tradeState: ${trade_state}`,
      );

      if (trade_state !== PAY_CONSTANTS.STATUS.TRADE_SUCCESS) {
        this.loggingService.warn(
          `[微信回调] 支付状态不是成功 - outTradeNo: ${out_trade_no}, tradeState: ${trade_state}`,
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
                `[微信回调] 订单不存在 - outTradeNo: ${out_trade_no}`,
              );
              throw new NotFoundException('订单不存在');
            }

            if (
              existingOrder.tradeState === PAY_CONSTANTS.STATUS.TRADE_SUCCESS ||
              existingOrder.tradeState === PAY_CONSTANTS.STATUS.TRADE_FINISHED
            ) {
              this.loggingService.warn(
                `[微信回调] 订单已处理，跳过 - outTradeNo: ${out_trade_no}`,
              );
              await queryRunner.rollbackTransaction();
              return true;
            }

            await queryRunner.manager.update(
              PayOrder,
              { outTradeNo: out_trade_no },
              {
                tradeState: PAY_CONSTANTS.STATUS.TRADE_SUCCESS,
                successTime: success_time,
                transactionId: transaction_id,
              },
            );

            this.loggingService.log(
              `[微信回调] 订单状态更新成功 - outTradeNo: ${out_trade_no}, transactionId: ${transaction_id}`,
            );

            const order = await queryRunner.manager.findOne(PayOrder, {
              where: { outTradeNo: out_trade_no },
            });

            if (order) {
              await this.deliverGoodsWithTransaction(
                queryRunner.manager,
                order,
              );
            }

            await queryRunner.commitTransaction();

            this.loggingService.log(
              `[微信回调] 回调处理完成 - outTradeNo: ${out_trade_no}`,
            );

            return true;
          } catch (error) {
            await queryRunner.rollbackTransaction();
            this.loggingService.error(
              `[微信回调] 处理失败 - outTradeNo: ${out_trade_no}, error: ${error.message}`,
            );
            throw error;
          } finally {
            await queryRunner.release();
          }
        },
        30000,
      );
    } catch (error) {
      this.loggingService.error(
        `[微信回调] 处理异常 - error: ${error.message}`,
      );
      throw new BadRequestException('支付通知处理失败');
    }
  }

  /**
   * @description 发货处理（在事务中执行）
   * @param {any} manager 数据库事务管理器
   * @param {PayOrder} order 支付订单实体
   * @returns {Promise<void>}
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
}
