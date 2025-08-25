import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';
import { LoggingService } from '@/common/services/logging.service';
import { ResponseHelper, ApiResponse } from '@/common';

// 导入对应产品模块的client models
const SmsClient = tencentcloud.sms.v20210111.Client;

export interface TencentSmsConfig {
  // 腾讯云API密钥ID
  secretId: string;
  // 腾讯云API密钥Key
  secretKey: string;
  // 短信应用ID，在控制台添加应用后生成的实际SDKAppID
  sdkAppId: string;
  // 签名内容，使用UTF-8编码，必须填写已审核通过的签名
  signName: string;
  // 模板ID，必须填写已审核通过的模板ID
  templateId: string;
  // 地域参数，用来标识希望操作哪个地域的数据
  region: string;
}

export interface SmsData {
  requestId?: string;
  error?: any;
}

@Injectable()
export class TencentSmsService {
  private readonly smsConfig: TencentSmsConfig;
  private smsClient: any;

  constructor(
    private configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.smsConfig = this._getSmsConfig();
    this._initSmsClient();
  }

  /**
   * 获取短信配置
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private _getSmsConfig(): TencentSmsConfig {
    const requiredConfigs = [
      'TENCENT_SECRET_ID',
      'TENCENT_SECRET_KEY', 
      'TENCENT_SMS_SDK_APP_ID',
      'TENCENT_SMS_SIGN_NAME',
      'TENCENT_SMS_TEMPLATE_ID',
      'TENCENT_SMS_REGION'
    ];

    // 检查所有必需的配置是否存在
    const missingConfigs = requiredConfigs.filter(key => !this.configService.get<string>(key));
    
    if (missingConfigs.length > 0) {
      this.loggingService.error('腾讯云短信配置缺失: ', missingConfigs.join(','));
      throw new InternalServerErrorException('短信服务配置不完整');
    }

    return {
      secretId: this.configService.get<string>('TENCENT_SECRET_ID')!,
      secretKey: this.configService.get<string>('TENCENT_SECRET_KEY')!,
      sdkAppId: this.configService.get<string>('TENCENT_SMS_SDK_APP_ID')!,
      signName: this.configService.get<string>('TENCENT_SMS_SIGN_NAME')!,
      templateId: this.configService.get<string>('TENCENT_SMS_TEMPLATE_ID')!,
      region: this.configService.get<string>('TENCENT_SMS_REGION')!
    };
  }

  /**
   * 初始化腾讯云短信客户端
   */
  private _initSmsClient(): void {
    try {
      // 实例化一个认证对象
      const clientConfig = {
        credential: {
          secretId: this.smsConfig.secretId,
          secretKey: this.smsConfig.secretKey,
        },
        region: this.smsConfig.region,
        profile: {
          httpProfile: {
            endpoint: "sms.tencentcloudapi.com",
          },
        },
      };

      this.smsClient = new SmsClient(clientConfig);
      this.loggingService.log('腾讯云短信客户端初始化成功');
    } catch (error) {
      this.loggingService.error('腾讯云短信客户端初始化失败:', error);
      throw new Error('短信服务初始化失败');
    }
  }

  /**
   * 发送验证码短信
   * @param phone 手机号（会自动添加国际区号）
   * @param code 验证码
   * @returns 发送结果
   */
  async sendSmsCode(phone: string, code: string): Promise<ApiResponse<SmsData>> {
    try {
      // 确保手机号包含国际区号
      const formattedPhone = phone.startsWith('+') ? phone : `${AUTH_CONSTANTS.PHONE.INTERNATIONAL_PREFIX}${phone}`;
      
      const params = {
        // 短信应用ID
        SmsSdkAppId: this.smsConfig.sdkAppId,
        // 短信签名内容
        SignName: this.smsConfig.signName,
        // 模板ID
        TemplateId: this.smsConfig.templateId,
        // 下发手机号码，采用E.164标准，+[国家或地区码][手机号]
        PhoneNumberSet: [formattedPhone],
        // 模板参数：[验证码, 有效期分钟数]
        TemplateParamSet: [code, AUTH_CONSTANTS.SMS.TEMPLATE_PARAMS.EXPIRATION_MINUTES],
      };

      const response = await this.smsClient.SendSms(params);
      
      this.loggingService.log('腾讯云短信发送响应:', JSON.stringify(response));

      // 检查发送结果
      if (response.SendStatusSet && response.SendStatusSet.length > 0) {
        const sendStatus = response.SendStatusSet[0];
        
        if (sendStatus.Code === 'Ok') {
          return ResponseHelper.success(
            { requestId: response.RequestId },
            '短信发送成功'
          );
        } else {
          this.loggingService.error(`短信发送失败 Code: ${sendStatus.Code}, Message: ${sendStatus.Message}`, response.RequestId);
          return ResponseHelper.error(
            `短信发送失败: ${sendStatus.Message}`,
            { requestId: response.RequestId, error: sendStatus }
          );
        }
      } else {
        this.loggingService.error('短信发送响应格式异常', response.RequestId);
        return ResponseHelper.error(
          '短信发送响应格式异常',
          { requestId: response.RequestId }
        );
      }
    } catch (error) {
      this.loggingService.error('短信发送异常:', error);
      return ResponseHelper.error(
        '短信发送异常，请稍后重试',
        { error }
      );
    }
  }
}
