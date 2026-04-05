import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { AUTH_CONSTANTS } from '@/modules/auth/constants';
import { LoggingService } from '@/common/services/logging.service';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import {
  TencentSmsConfig,
  TencentSendSmsResponse,
  TencentSmsClient,
  SmsData,
} from '@/modules/auth/types';

// 导入对应产品模块的 client models
const SmsClient = tencentcloud.sms.v20210111.Client;

@Injectable()
export class TencentSmsService {
  private readonly smsConfig: TencentSmsConfig;
  private smsClient!: TencentSmsClient;

  constructor(
    private configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.smsConfig = this.getSmsConfig();
    this.initSmsClient();
  }

  /**
   * 获取短信配置
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getSmsConfig(): TencentSmsConfig {
    const requiredConfigs = [
      'TENCENT_SECRET_ID',
      'TENCENT_SECRET_KEY',
      'TENCENT_SMS_SDK_APP_ID',
      'TENCENT_SMS_SIGN_NAME',
      'TENCENT_SMS_TEMPLATE_ID',
      'TENCENT_SMS_REGION',
    ];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      this.loggingService.error(
        `[腾讯云短信配置缺失] 配置缺失: ${missingConfigs.join(', ')}`,
      );
      throw new InternalServerErrorException('短信服务配置不完整');
    }

    return {
      secretId: this.configService.get<string>('TENCENT_SECRET_ID')!,
      secretKey: this.configService.get<string>('TENCENT_SECRET_KEY')!,
      sdkAppId: this.configService.get<string>('TENCENT_SMS_SDK_APP_ID')!,
      signName: this.configService.get<string>('TENCENT_SMS_SIGN_NAME')!,
      templateId: this.configService.get<string>('TENCENT_SMS_TEMPLATE_ID')!,
      region: this.configService.get<string>('TENCENT_SMS_REGION')!,
    };
  }

  /**
   * 初始化腾讯云短信客户端
   */
  private initSmsClient(): void {
    try {
      const clientConfig = {
        credential: {
          secretId: this.smsConfig.secretId,
          secretKey: this.smsConfig.secretKey,
        },
        region: this.smsConfig.region,
        profile: {
          httpProfile: {
            endpoint: 'sms.tencentcloudapi.com',
          },
        },
      };

      this.smsClient = new SmsClient(clientConfig);
    } catch (error) {
      this.loggingService.error(
        '[腾讯云短信] 客户端初始化失败，请检查配置是否正确',
      );
      throw new Error('短信服务初始化失败');
    }
  }

  /**
   * 根据腾讯云短信错误码获取友好的错误信息
   */
  private getSmsErrorInfo(code: string): { user: string; log: string } {
    return AUTH_CONSTANTS.SMS_ERROR_CODES[code as keyof typeof AUTH_CONSTANTS.SMS_ERROR_CODES] ?? {
      user: '短信发送失败，请稍后重试',
      log: `未知错误码: ${code}`,
    };
  }

  /**
   * 发送验证码短信
   * @param phone 手机号（会自动添加国际区号）
   * @param code 验证码
   * @returns 发送结果
   */
  async sendSmsCode(
    phone: string,
    code: string,
  ): Promise<ApiResponse<SmsData>> {
    try {
      const formattedPhone = phone.startsWith('+')
        ? phone
        : `${AUTH_CONSTANTS.PHONE.INTERNATIONAL_PREFIX}${phone}`;

      const params = {
        SmsSdkAppId: this.smsConfig.sdkAppId,
        SignName: this.smsConfig.signName,
        TemplateId: this.smsConfig.templateId,
        PhoneNumberSet: [formattedPhone],
        TemplateParamSet: [
          code,
          AUTH_CONSTANTS.SMS.TEMPLATE_PARAMS.EXPIRATION_MINUTES,
        ],
      };

      const response: TencentSendSmsResponse =
        await this.smsClient.SendSms(params);

      if (response.SendStatusSet && response.SendStatusSet.length > 0) {
        const sendStatus = response.SendStatusSet[0];

        if (sendStatus.Code === 'Ok') {
          return ResponseHelper.success(
            { requestId: response.RequestId },
            '短信发送成功',
          );
        }

        const errorInfo = this.getSmsErrorInfo(sendStatus.Code ?? '');
        this.loggingService.error(
          `[腾讯云短信发送失败] RequestId: ${response.RequestId}, 错误原因: ${errorInfo.log}, 错误码: ${sendStatus.Code}`,
        );
        return ResponseHelper.error(errorInfo.user, {
          requestId: response.RequestId,
        });
      }

      this.loggingService.error(
        `[腾讯云短信响应格式异常] RequestId: ${response.RequestId ?? '-'}`,
      );
      return ResponseHelper.error('短信发送响应异常，请稍后重试', {
        requestId: response.RequestId,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.loggingService.error(`[腾讯云短信异常] ${errMsg}`);
      return ResponseHelper.error('短信发送异常，请稍后重试');
    }
  }
}
