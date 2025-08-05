import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@/modules/user/dto/create-user.dto';

/**
 * 更新用户的数据传输对象
 * 基于创建用户DTO，但排除密码字段，且所有字段都是可选的
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {}