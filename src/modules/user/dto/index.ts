import {
  IsString,
  IsOptional,
  IsEnum,
  Matches,
  MaxLength,
} from 'class-validator';
import { USER_CONSTANTS, UserRole } from '@/modules/user/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新用户的数据传输对象
 * 定义更新用户时可修改的字段和验证规则
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(USER_CONSTANTS.VALIDATION.PHONE_REGEX, {
    message: '请输入正确的手机号格式',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: '昵称',
    maxLength: USER_CONSTANTS.CONSTRAINTS.NICKNAME_MAX_LENGTH,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(USER_CONSTANTS.CONSTRAINTS.NICKNAME_MAX_LENGTH, {
    message: `昵称长度不能超过${USER_CONSTANTS.CONSTRAINTS.NICKNAME_MAX_LENGTH}位`,
  })
  nickname?: string;

  @ApiPropertyOptional({ description: '用户角色', enum: ['user', 'admin'] })
  @IsOptional()
  @IsEnum(Object.values(USER_CONSTANTS.ROLES), {
    message: `角色必须是 ${USER_CONSTANTS.ROLES.USER} 或 ${USER_CONSTANTS.ROLES.ADMIN}`,
  })
  role?: UserRole;
}
