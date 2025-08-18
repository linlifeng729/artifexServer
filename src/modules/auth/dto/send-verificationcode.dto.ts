import { IsString, Matches } from 'class-validator';

/**
 * 发送验证码数据传输对象
 * 定义发送验证码时需要的字段和验证规则
 */
export class SendVerificationCodeDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号格式' })
  phone: string;
}
