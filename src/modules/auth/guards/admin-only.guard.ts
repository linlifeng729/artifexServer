import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ONLY_KEY } from '@/modules/auth/decorators/admin-only.decorator';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators/public.decorator';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

/**
 * 管理员权限守卫
 * 
 * 检查用户是否拥有管理员权限
 * 配合@AdminOnly()装饰器使用，确保只有管理员角色可以访问特定路由
 * 
 * 注意：此守卫依赖于JwtAuthGuard已经执行过并在request中设置了user信息
 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * 守卫激活方法
   * 
   * 检查当前用户是否为管理员角色
   * 
   * @param context 执行上下文，包含请求信息
   * @returns boolean 返回 true 允许访问，false 或抛出异常拒绝访问
   * 
   * @throws ForbiddenException 当用户不是管理员时抛出禁止访问异常
   */
  canActivate(context: ExecutionContext): boolean {
    // 检查是否是公共路由
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 检查是否需要管理员权限
    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAdmin) {
      return true;
    }

    // 获取请求对象和用户信息
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 检查用户是否存在
    if (!user) {
      throw new ForbiddenException('用户信息缺失');
    }
    
    // 检查用户角色是否为管理员
    if (user.role !== AUTH_CONSTANTS.ROLES.ADMIN) {
      throw new ForbiddenException('权限不足，请联系管理员');
    }

    return true;
  }
}
