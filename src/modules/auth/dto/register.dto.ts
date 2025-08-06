import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * 用户注册数据传输对象
 * 用于普通用户自行注册，不包含角色设置
 */
export class RegisterDto {
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号格式' })
  phone: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度至少6位' })
  @MaxLength(100, { message: '密码长度不能超过100位' })
  password: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(20, { message: '昵称长度不能超过20位' })
  nickname?: string;
}