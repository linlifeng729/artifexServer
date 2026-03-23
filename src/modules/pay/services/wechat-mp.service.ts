import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PAY_CONSTANTS } from '../constants';

/**
 * 微信小程序服务
 * 处理微信小程序相关业务逻辑
 */
@Injectable()
export class WechatMPService {
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.appId = this.configService.get<string>('wechatMP.appId') ?? '';
    this.appSecret = this.configService.get<string>('wechatMP.appSecret') ?? '';
  }

  /**
   * 通过 code 获取用户 OpenId
   * @param code 微信小程序登录 code
   * @returns OpenId
   */
  async getOpenIdByCode(code: string): Promise<string> {
    try {
      const url =
        PAY_CONSTANTS.WX_API_CONFIG.API_DOMAIN +
        PAY_CONSTANTS.WX_API.MP_JSCODE2SESSION;

      const params = {
        grant_type: 'authorization_code',
        appid: this.appId,
        secret: this.appSecret,
        js_code: code,
      };

      const response = await firstValueFrom(
        this.httpService.get(url, { params }),
      );

      if (response.data.errcode) {
        throw new InternalServerErrorException(
          `获取OpenId失败: ${response.data.errmsg}`,
        );
      }

      return response.data.openid;
    } catch (error) {
      throw new InternalServerErrorException(
        `微信小程序获取OpenId失败: ${error.message}`,
      );
    }
  }
}
