import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ADMIN_ONLY_KEY = 'adminOnly';

/** 标记路由公开访问，跳过 JWT 认证 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** 标记路由仅允许管理员访问，需配合 AdminOnlyGuard 使用 */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

