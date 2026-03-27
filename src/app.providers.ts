import { Logger } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

/**
 * 应用全局 Providers
 * 用于集中管理全局守卫、拦截器、过滤器等
 */
export const appProviders = [
  Logger,
  // 全局限流守卫（最先执行，防止暴力破解）
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
  // 全局 JWT 认证守卫
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  // 全局日志拦截器（必须在响应拦截器之前）
  {
    provide: APP_INTERCEPTOR,
    useClass: LoggingInterceptor,
  },
  // 全局响应拦截器
  {
    provide: APP_INTERCEPTOR,
    useClass: ResponseInterceptor,
  },
  // 全局异常过滤器
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter,
  },
];
