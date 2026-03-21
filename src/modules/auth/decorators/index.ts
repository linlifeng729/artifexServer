import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ADMIN_ONLY_KEY = 'adminOnly';

/** 标记路由公开访问，跳过 JWT 认证 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** 标记路由仅允许管理员访问，需配合 AdminOnlyGuard 使用 */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

/**
 * 从请求中获取当前用户信息
 * 使用方式: @CurrentUser('userId') 或 @CurrentUser()
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
