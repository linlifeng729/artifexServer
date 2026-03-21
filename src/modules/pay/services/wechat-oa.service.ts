import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ICrypto } from '@/common/utils/crypto';

/**
 * 微信公众号服务
 * 处理微信公众号相关业务逻辑
 */
@Injectable()
export class WechatOAService {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly token: string;

  // 缓存 access_token 和 jsapi_ticket
  private accessTokenCache: { token: string; expiresAt: number } | null = null;
  private jsapiTicketCache: { ticket: string; expiresAt: number } | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.appId = this.configService.get<string>('wechatOA.appId') ?? '';
    this.appSecret = this.configService.get<string>('wechatOA.appSecret') ?? '';
    this.token = this.configService.get<string>('wechatOA.token') ?? '';
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
  ): boolean {
    const arr = [this.token, timestamp, nonce];
    return ICrypto.verifyHash(arr.sort().join(''), signature, 'sha1', 'hex');
  }

  /**
   * 通过 code 获取用户 OpenId
   * @param code 微信授权 code
   * @returns OpenId 和 AccessToken
   */
  async getOpenIdByCode(code: string): Promise<{
    openid: string;
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    scope: string;
  }> {
    try {
      const url = 'https://api.weixin.qq.com/sns/oauth2/access_token';

      const params = {
        grant_type: 'authorization_code',
        appid: this.appId,
        secret: this.appSecret,
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
      const url = 'https://api.weixin.qq.com/cgi-bin/token';

      const params = {
        grant_type: 'client_credential',
        appid: this.appId,
        secret: this.appSecret,
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
      const url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';

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
  async generateJsSdkSignature(url: string): Promise<{
    signature: string;
    timestamp: string;
    nonceStr: string;
    appId: string;
  }> {
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
      appId: this.appId,
    };
  }
}
