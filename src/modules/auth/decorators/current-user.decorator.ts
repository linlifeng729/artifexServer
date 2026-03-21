import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
