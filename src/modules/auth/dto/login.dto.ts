import { IsString, Length, Matches } from 'class-validator';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

/**
 * 用户登录数据传输对象
 * 定义登录时需要的字段和验证规则
 */
export class LoginDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(AUTH_CONSTANTS.PHONE.REGEX, { message: '请输入正确的手机号格式' })
  phone: string;

  @IsString({ message: '验证码必须是字符串' })
  @Length(AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH, AUTH_CONSTANTS.VERIFICATION_CODE.LENGTH, { 
    message: '验证码必须是6位数字' 
  })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  verificationCode: string;
}