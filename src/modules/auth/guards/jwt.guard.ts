import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@/modules/auth/services/auth.service';
import { IS_PUBLIC_KEY } from '@/modules/auth/decorators';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/index';

/**
 * JWT 认证守卫
 * 自动检查所有路由的 JWT token，支持 @Public() 装饰器跳过认证
 * 验证 token 有效性并将用户信息注入 request.user
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('访问令牌缺失');
    }

    try {
      const user = await this.authService.validateToken(token);
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('无效的访问令牌');
    }
  }

  /** 解析 Authorization 头，提取 Bearer token */
  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === AUTH_CONSTANTS.JWT.BEARER_PREFIX ? token : undefined;
  }
}
