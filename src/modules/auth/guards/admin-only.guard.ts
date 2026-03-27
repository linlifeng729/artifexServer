import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY, IS_PUBLIC_KEY } from '@/modules/auth/decorators';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/index';

/**
 * 管理员权限守卫
 * 配合 @AdminOnly() 装饰器使用，确保只有管理员角色可以访问特定路由
 * 依赖 JwtAuthGuard 先执行并在 request 中设置 user 信息
 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('用户信息缺失');
    }

    if (user.role !== AUTH_CONSTANTS.ROLES.ADMIN) {
      throw new ForbiddenException('权限不足，请联系管理员');
    }

    return true;
  }
}
