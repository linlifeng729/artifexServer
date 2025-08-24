import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from '../services/logging.service';

/**
 * 请求日志拦截器
 * 记录所有HTTP请求的详细信息，包括：
 * - 请求路径、方法、IP地址
 * - 请求头、查询参数、请求体
 * - 响应状态码、响应时间
 * - 错误信息（如果有）
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // 生成请求ID用于追踪
    const requestId = this.generateRequestId();

    // 记录请求开始
    this.loggingService.logRequest(request, requestId);

    return next.handle().pipe(
      tap((data) => {
        // 记录成功响应
        const responseTime = Date.now() - startTime;
        this.loggingService.logResponse(request, response, responseTime, requestId, data);
      }),
      catchError((error) => {
        // 记录错误响应
        const responseTime = Date.now() - startTime;
        this.loggingService.logError(request, response, responseTime, error, requestId, error.response || error.data);
        throw error;
      }),
    );
  }

  /**
   * 生成唯一的请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
