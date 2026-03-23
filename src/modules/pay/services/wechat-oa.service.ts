import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICrypto } from '@/common/utils/crypto';
import { LoggingService } from '@/common/services/logging.service';
import { PAY_CONSTANTS } from '../constants';
import {
  WechatOAConfig,
  WechatOAOpenIdResult,
  WechatOAJsSdkSignature,
  WechatTokenCache,
  WechatTicketCache,
} from '../types';

@Injectable()
export class WechatOAService {
  private readonly oaConfig: WechatOAConfig;

  // 缓存 access_token 和 jsapi_ticket
  private accessTokenCache: WechatTokenCache | null = null;
  private jsapiTicketCache: WechatTicketCache | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly loggingService: LoggingService,
  ) {
    this.oaConfig = this.getOaConfig();
  }

  /**
   * 获取微信公众号配置
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getOaConfig(): WechatOAConfig {
    const requiredConfigs = ['WX_OA_APP_ID', 'WX_OA_APP_SECRET', 'WX_TOKEN'];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      this.loggingService.error(
        `[微信公众号] 配置缺失: ${missingConfigs.join(', ')}`,
      );
      throw new InternalServerErrorException('微信公众号配置不完整');
    }

    return {
      appId: this.configService.get<string>('WX_OA_APP_ID')!,
      appSecret: this.configService.get<string>('WX_OA_APP_SECRET')!,
      token: this.configService.get<string>('WX_TOKEN')!,
    };
  }

  /**
   * 验证微信服务器签名
   * @param signature 签名
   * @param timestamp 时间戳
   * @param nonce 随机数
   * @param echostr 随机字符串
   * @returns 是否验证通过
   */
  verifyServerSignature(
    signature: string,
    timestamp: string,
    nonce: string,
    echostr: string,
  ): string {
    const arr = [this.oaConfig.token, timestamp, nonce];
    const isValidSignature = ICrypto.verifyHash(
      arr.sort().join(''),
      signature,
      'sha1',
      'hex',
    );
    return isValidSignature ? echostr : '';
  }

  /**
   * 通过 code 获取用户 OpenId
   * @param code 微信授权 code
   * @returns OpenId 和 AccessToken
   */
  async getOpenIdByCode(code: string): Promise<WechatOAOpenIdResult> {
    try {
      const url =
        PAY_CONSTANTS.WX_API_CONFIG.API_DOMAIN +
        PAY_CONSTANTS.WX_API.OA_ACCESS_TOKEN;

      const params = {
        grant_type: 'authorization_code',
        appid: this.oaConfig.appId,
        secret: this.oaConfig.appSecret,
        code,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      if (response.data.errcode) {
        throw new InternalServerErrorException(
          `获取OpenId失败: ${response.data.errmsg}`,
        );
      }

      return {
        openid: response.data.openid,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
        refreshToken: response.data.refresh_token,
        scope: response.data.scope,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `微信公众号获取OpenId失败: ${error.message}`,
      );
    }
  }

  /**
   * 获取 AccessToken
   */
  async getAccessToken(): Promise<string> {
    // 检查缓存
    if (this.accessTokenCache && Date.now() < this.accessTokenCache.expiresAt) {
      return this.accessTokenCache.token;
    }

    try {
      const url =
        PAY_CONSTANTS.WX_API_CONFIG.API_DOMAIN + PAY_CONSTANTS.WX_API.OA_TOKEN;

      const params = {
        grant_type: 'client_credential',
        appid: this.oaConfig.appId,
        secret: this.oaConfig.appSecret,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      if (response.data.errcode) {
        throw new InternalServerErrorException(
          `获取AccessToken失败: ${response.data.errmsg}`,
        );
      }

      // 缓存 token，提前 5 分钟过期
      this.accessTokenCache = {
        token: response.data.access_token,
        expiresAt: Date.now() + (response.data.expires_in - 300) * 1000,
      };

      return response.data.access_token;
    } catch (error) {
      throw new InternalServerErrorException(
        `获取AccessToken失败: ${error.message}`,
      );
    }
  }

  /**
   * 获取 JSAPI Ticket
   */
  async getJsapiTicket(): Promise<string> {
    // 检查缓存
    if (this.jsapiTicketCache && Date.now() < this.jsapiTicketCache.expiresAt) {
      return this.jsapiTicketCache.ticket;
    }

    try {
      const accessToken = await this.getAccessToken();
      const url =
        PAY_CONSTANTS.WX_API_CONFIG.API_DOMAIN +
        PAY_CONSTANTS.WX_API.OA_JSAPI_TICKET;

      const params = {
        access_token: accessToken,
        type: 'jsapi',
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      if (response.data.errcode) {
        throw new InternalServerErrorException(
          `获取JsapiTicket失败: ${response.data.errmsg}`,
        );
      }

      // 缓存 ticket，提前 5 分钟过期
      this.jsapiTicketCache = {
        ticket: response.data.ticket,
        expiresAt: Date.now() + (response.data.expires_in - 300) * 1000,
      };

      return response.data.ticket;
    } catch (error) {
      throw new InternalServerErrorException(
        `获取JsapiTicket失败: ${error.message}`,
      );
    }
  }

  /**
   * 生成 JS-SDK 签名
   * @param url 当前网页的 URL
   * @returns 签名信息
   */
  async generateJsSdkSignature(url: string): Promise<WechatOAJsSdkSignature> {
    const nonceStr = ICrypto.generateRandomString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const ticket = await this.getJsapiTicket();

    // JS-SDK使用权限签名算法
    const arr = [
      `noncestr=${nonceStr}&`,
      `timestamp=${timestamp}&`,
      `jsapi_ticket=${ticket}&`,
      `url=${url}`,
    ];

    const signature = ICrypto.createHash(arr.sort().join(''), 'sha1', 'hex');

    return {
      signature,
      timestamp,
      nonceStr,
      appId: this.oaConfig.appId,
    };
  }
}
