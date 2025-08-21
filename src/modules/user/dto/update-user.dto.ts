import { IsString, IsOptional, IsEnum, Matches, MaxLength } from 'class-validator';
import { USER_CONSTANTS, UserRole } from '@/modules/user/constants';

/**
 * 更新用户的数据传输对象
 * 定义更新用户时可修改的字段和验证规则
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(USER_CONSTANTS.VALIDATION.PHONE_REGEX, { 
    message: USER_CONSTANTS.ERROR_MESSAGES.PHONE_FORMAT_INVALID 
  })
  phone?: string;

  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(USER_CONSTANTS.CONSTRAINTS.NICKNAME_MAX_LENGTH, { 
    message: USER_CONSTANTS.ERROR_MESSAGES.NICKNAME_TOO_LONG 
  })
  nickname?: string;

  @IsOptional()
  @IsEnum(Object.values(USER_CONSTANTS.ROLES), { 
    message: USER_CONSTANTS.ERROR_MESSAGES.ROLE_INVALID 
  })
  role?: UserRole;
}