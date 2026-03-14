import { IsString, Matches, IsNotEmpty } from 'class-validator';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

/**
 * 发送验证码数据传输对象
 * 定义发送验证码时需要的字段和验证规则
 */
export class SendVerificationCodeDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(AUTH_CONSTANTS.PHONE.REGEX, { message: '请输入正确的手机号格式' })
  phone: string;

  // 极验滑块验证码相关字段
  @IsString({ message: 'captcha_id 必须是字符串' })
  @IsNotEmpty({ message: 'captcha_id 不能为空' })
  captcha_id: string;

  @IsString({ message: 'lot_number 必须是字符串' })
  @IsNotEmpty({ message: 'lot_number 不能为空' })
  lot_number: string;

  @IsString({ message: 'captcha_output 必须是字符串' })
  @IsNotEmpty({ message: 'captcha_output 不能为空' })
  captcha_output: string;

  @IsString({ message: 'pass_token 必须是字符串' })
  @IsNotEmpty({ message: 'pass_token 不能为空' })
  pass_token: string;

  @IsString({ message: 'gen_time 必须是字符串' })
  @IsNotEmpty({ message: 'gen_time 不能为空' })
  gen_time: string;
}
