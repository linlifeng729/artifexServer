import { IsString, IsOptional, IsEnum, Matches, MaxLength } from 'class-validator';

/**
 * 更新用户的数据传输对象
 * 定义更新用户时可修改的字段和验证规则
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号格式' })
  phone?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称长度不能超过50位' })
  nickname?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'], { message: '角色必须是 user 或 admin' })
  role?: 'user' | 'admin';
}