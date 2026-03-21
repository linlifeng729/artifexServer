import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AlipaySdk } from 'alipay-sdk';
import { ConfigService } from '@nestjs/config';
import { ICrypto } from '@/common/utils/crypto';

/**
 * 支付宝服务
 * 处理支付宝支付相关业务逻辑
 */
@Injectable()
export class AlipayService {
  private alipaySdk: AlipaySdk;

  constructor(private readonly configService: ConfigService) {
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
   * @param outTradeNo 商户订单号
   * @param totalAmount 总金额（单位：元）
   * @param subject 商品名称
   * @param productCode 产品码（当面付为 FAST_INSTANT_TRADE_PAY）
   * @param notifyUrl 通知地址
   * @param returnUrl 返回地址
   * @returns 支付表单 HTML
   */
  async generatePayForm(
    outTradeNo: string,
    totalAmount: number,
    subject: string,
    productCode: string,
    notifyUrl: string,
    returnUrl?: string,
  ): Promise<string> {
    try {
      const result = await this.alipaySdk.pageExec('trade', {
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
   * 验证支付宝回调通知签名
   * @param params 回调参数
   * @returns 是否验签成功
   */
  verifyNotifySign(params: Record<string, any>): boolean {
    try {
      return this.alipaySdk.checkNotifySignV2(params);
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成随机订单号
   * @param length 长度
   * @returns 随机订单号
   */
  generateOutTradeNo(length: number = 32): string {
    return ICrypto.generateRandomString(length);
  }
}
