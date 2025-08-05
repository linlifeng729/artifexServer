import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 用户登录数据传输对象
 * 定义登录时需要的字段和验证规则
 */
export class LoginDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号格式' })
  phone: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(100, { message: '密码长度不能超过100位' })
  password: string;
}