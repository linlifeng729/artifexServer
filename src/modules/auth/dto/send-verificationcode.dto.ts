import { IsString, Matches } from 'class-validator';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

/**
 * 发送验证码数据传输对象
 * 定义发送验证码时需要的字段和验证规则
 */
export class SendVerificationCodeDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(AUTH_CONSTANTS.PHONE.REGEX, { message: AUTH_CONSTANTS.ERROR_MESSAGES.PHONE_INVALID })
  phone: string;
}
