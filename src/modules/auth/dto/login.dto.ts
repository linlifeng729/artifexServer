import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * 用户登录数据传输对象
 * 定义登录时需要的字段和验证规则
 */
export class LoginDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少3位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  username: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(100, { message: '密码长度不能超过100位' })
  password: string;
}