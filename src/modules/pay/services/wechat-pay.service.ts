import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ICrypto } from '@/common/utils/crypto';
import { WX_PAY_API, WX_API_CONFIG } from '@/modules/pay/constants';

/**
 * 微信支付服务
 * 处理微信支付相关业务逻辑
 */
@Injectable()
export class WechatPayService {
  private readonly mchId: string;
  private readonly notifySecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.mchId = this.configService.get<string>('wechatPay.mchId') ?? '';
    this.notifySecret =
      this.configService.get<string>('wechatPay.notifySecret') ?? '';
  }

  /**
   * 生成微信支付签名（用于调起支付）
   * @param packageId prepay_id
   * @param nonceStr 随机字符串
   * @param timestamp 时间戳
   * @param appId AppID
   * @returns 签名
   */
  async generatePaySign(
    packageId: string,
    nonceStr: string,
    timestamp: number,
    appId: string,
  ): Promise<string> {
    const message = `${appId}\n${timestamp}\n${nonceStr}\n${packageId}\n`;
    const privateKey =
      this.configService.get<string>('wechatPay.privateKey') ?? '';

    return ICrypto.createSign(message, privateKey, 'RSA-SHA256', 'base64');
  }

  /**
   * 生成微信支付请求签名（用于 API 调用）
   * @param url 请求 URL
   * @param method 请求方法
   * @param body 请求体
   * @returns Authorization 头
   */
  async generateRequestSignature(
    url: string,
    method: string,
    body: Record<string, any>,
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = ICrypto.generateRandomString(32);
    const serialNo = this.configService.get<string>('wechatPay.serialNo') ?? '';

    // 构建签名序列
    const signature = await this.generateSign(
      url,
      timestamp,
      nonceStr,
      method,
      body,
    );

    return `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchId}",serial_no="${serialNo}",nonce_str="${nonceStr}",timestamp="${timestamp}",signature="${signature}"`;
  }

  /**
   * 生成签名
   */
  private async generateSign(
    url: string,
    timestamp: number,
    nonceStr: string,
    method: string,
    body: Record<string, any>,
  ): Promise<string> {
    const privateKey =
      this.configService.get<string>('wechatPay.privateKey') ?? '';

    // 构造签名串
    const signStr = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${JSON.stringify(body)}\n`;

    return ICrypto.createSign(signStr, privateKey, 'RSA-SHA256', 'base64');
  }

  /**
   * 微信 Native 支付统一下单
   * @param appId AppID
   * @param outTradeNo 商户订单号
   * @param description 商品描述
   * @param amount 金额（分）
   * @param notifyUrl 通知地址
   * @returns code_url 用于生成二维码
   */
  async unifiedOrderNative(
    appId: string,
    outTradeNo: string,
    description: string,
    amount: number,
    notifyUrl: string,
  ): Promise<string> {
    try {
      const url = `${WX_API_CONFIG.MCH_DOMAIN}${WX_PAY_API.NATIVE}`;

      const requestParams = {
        appid: appId,
        mchid: this.mchId,
        description,
        out_trade_no: outTradeNo,
        notify_url: notifyUrl,
        amount: {
          total: amount,
        },
      };

      const authorization = await this.generateRequestSignature(
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
        `微信Native支付下单失败: ${error.message}`,
      );
    }
  }

  /**
   * 微信 JSAPI 支付统一下单
   * @param appId AppID
   * @param outTradeNo 商户订单号
   * @param description 商品描述
   * @param amount 金额（分）
   * @param notifyUrl 通知地址
   * @param openid 用户 openid
   * @returns prepay_id
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
      const url = `${WX_API_CONFIG.MCH_DOMAIN}${WX_PAY_API.JSAPI}`;

      const requestParams = {
        appid: appId,
        mchid: this.mchId,
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

      const authorization = await this.generateRequestSignature(
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
        `微信JSAPI支付下单失败: ${error.message}`,
      );
    }
  }

  /**
   * 生成 JSAPI 调起支付参数
   * @param appId AppID
   * @param prepayId prepay_id
   * @param callbackUrl 回调 URL
   * @returns 调起支付参数
   */
  async generateJsapiPayParams(
    appId: string,
    prepayId: string,
    callbackUrl?: string,
  ): Promise<{
    nonceStr: string;
    timestamp: number;
    package: string;
    signType: string;
    paySign: string;
    callbackUrl?: string;
  }> {
    const nonceStr = ICrypto.generateRandomString(32);
    const timestamp = Math.floor(Date.now() / 1000);
    const packageId = `prepay_id=${prepayId}`;
    const paySign = await this.generatePaySign(
      packageId,
      nonceStr,
      timestamp,
      appId,
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
   * 解密微信支付通知数据
   * @param ciphertext 加密数据
   * @param nonce 随机字符串
   * @param associatedData 关联数据
   * @returns 解密后的数据
   */
  decryptNotifyData<T = any>(
    ciphertext: string,
    nonce: string,
    associatedData: string,
  ): T {
    try {
      const key = this.notifySecret;
      const keyBuffer = Buffer.from(key, 'utf8');
      const nonceBuffer = Buffer.from(nonce, 'utf8');
      const associatedDataBuffer = Buffer.from(associatedData, 'utf8');
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      // AES-256-GCM 解密
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
   * 获取当前时间戳（秒）
   */
  getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
