import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * 创建用户的数据传输对象
 * 定义创建用户时需要的字段和验证规则
 */
export class CreateUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度至少3位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  username: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(100, { message: '密码长度不能超过100位' })
  password: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(255, { message: '邮箱长度不能超过255位' })
  email?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;
}