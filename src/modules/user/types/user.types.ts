/**
 * User模块类型定义
 */
import { User } from '@/modules/user/entities/user.entity';

/**
 * 用户公开信息类型（排除敏感字段）
 */
export type PublicUser = Omit<User, 'userId' | 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt' | 'lastCodeSentAt'>;

/**
 * 用户内部信息类型（包含userId和phoneHash，用于系统内部）
 */
export type InternalUser = Omit<User, 'verificationCode' | 'verificationCodeExpiredAt' | 'lastCodeSentAt'>;

/**
 * 用户分页查询结果类型
 */
export interface UserPaginatedResult {
  list: PublicUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 用户删除结果类型
 */
export interface UserDeleteResult {
  deleted: boolean;
}
