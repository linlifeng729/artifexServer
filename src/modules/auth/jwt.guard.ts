import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * JWT 认证守卫
 * 
 * 实现了 NestJS 的 CanActivate 接口，用于保护需要身份验证的路由
 * 
 * 功能特性：
 * - 自动检查所有路由的 JWT token
 * - 支持通过 @Public() 装饰器跳过认证
 * - 验证 token 有效性并将用户信息注入请求对象
 * - 提供详细的错误信息
 * 
 * @example
 * ```typescript
 * // 在模块中全局应用
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: JwtAuthGuard,
 *   },
 * ]
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  /**
   * 守卫激活方法
   * 
   * 执行认证逻辑，决定是否允许访问受保护的资源
   * 
   * @param context 执行上下文，包含请求信息
   * @returns Promise<boolean> 返回 true 允许访问，false 或抛出异常拒绝访问
   * 
   * @throws UnauthorizedException 当认证失败时抛出未授权异常
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否是公共路由（使用 @Public() 装饰器）
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 获取 HTTP 请求对象
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('访问令牌缺失');
    }

    try {
      // 验证 JWT token
      const result = await this.authService.verifyToken(token);
      if (!result.success) {
        throw new UnauthorizedException(result.message);
      }
      
      // 将用户信息附加到请求对象上，便于后续使用
      request.user = result.data;
      return true;
    } catch (error) {
      throw new UnauthorizedException('无效的访问令牌');
    }
  }

  /**
   * 从请求头中提取 JWT token
   * 
   * 解析 Authorization 头，提取 Bearer token
   * 
   * @param request HTTP 请求对象
   * @returns string | undefined 返回提取的 token，如果不存在则返回 undefined
   * 
   * @example
   * ```
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * ```
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}