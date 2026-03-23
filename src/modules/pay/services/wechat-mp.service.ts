import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '@/common/services/logging.service';
import { PAY_CONSTANTS } from '../constants';

/**
 * 微信小程序服务
 * 处理微信小程序相关业务逻辑
 */
@Injectable()
export class WechatMPService {
  private readonly config: { appId: string; appSecret: string };

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly loggingService: LoggingService,
  ) {
    this.config = this.getWxMpConfig();
  }

  /**
   * @description 获取微信小程序配置
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getWxMpConfig(): { appId: string; appSecret: string } {
    const requiredConfigs = ['WX_MP_APP_ID', 'WX_MP_APP_SECRET'];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      this.loggingService.error(
        `[微信小程序] 配置缺失: ${missingConfigs.join(', ')}`,
      );
      throw new InternalServerErrorException('微信小程序配置不完整');
    }

    return {
      appId: this.configService.get<string>('WX_MP_APP_ID')!,
      appSecret: this.configService.get<string>('WX_MP_APP_SECRET')!,
    };
  }

  /**
   * @description 通过 code 获取用户 OpenId
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
        appid: this.config.appId,
        secret: this.config.appSecret,
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
