import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

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

export interface SmsResult {
  success: boolean;
  message: string;
  requestId?: string;
  error?: any;
}

@Injectable()
export class TencentSmsService {
  private readonly smsConfig: TencentSmsConfig;
  private smsClient: any;

  constructor(
    private configService: ConfigService,
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.smsConfig = this.getSmsConfig();
    this.initSmsClient();
  }

  /**
   * 获取短信配置
   */
  private getSmsConfig(): TencentSmsConfig {
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
  private initSmsClient(): void {
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
      this.logger.log('腾讯云短信客户端初始化成功');
    } catch (error) {
      this.logger.error('腾讯云短信客户端初始化失败:', error);
      throw new Error('短信服务初始化失败');
    }
  }

  /**
   * 发送验证码短信
   * @param phone 手机号（需要包含国际区号，如+86）
   * @param code 验证码
   * @returns 发送结果
   */
  async sendVerificationCode(phone: string, code: string): Promise<SmsResult> {
    try {      
      const params = {
        // 短信应用ID
        SmsSdkAppId: this.smsConfig.sdkAppId,
        // 短信签名内容
        SignName: this.smsConfig.signName,
        // 模板ID
        TemplateId: this.smsConfig.templateId,
        // 下发手机号码，采用E.164标准，+[国家或地区码][手机号]
        PhoneNumberSet: [phone],
        // 模板参数：[验证码, 有效期分钟数]
        TemplateParamSet: [code, '5'],
      };

      this.logger.log(`准备发送短信到 ${phone}，验证码: ${code}`);

      const response = await this.smsClient.SendSms(params);
      
      this.logger.log('腾讯云短信发送响应:', JSON.stringify(response, null, 2));

      // 检查发送结果
      if (response.SendStatusSet && response.SendStatusSet.length > 0) {
        const sendStatus = response.SendStatusSet[0];
        
        if (sendStatus.Code === 'Ok') {
          return {
            success: true,
            message: '短信发送成功',
            requestId: response.RequestId
          };
        } else {
          this.logger.error(`短信发送失败 - Code: ${sendStatus.Code}, Message: ${sendStatus.Message}`);
          return {
            success: false,
            message: `短信发送失败: ${sendStatus.Message}`,
            requestId: response.RequestId,
            error: sendStatus
          };
        }
      } else {
        this.logger.error('短信发送响应格式异常');
        return {
          success: false,
          message: '短信发送响应格式异常',
          requestId: response.RequestId
        };
      }
    } catch (error) {
      this.logger.error('短信发送异常:', error);
      return {
        success: false,
        message: '短信发送异常，请稍后重试',
        error
      };
    }
  }
}
