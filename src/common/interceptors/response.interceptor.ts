import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/**
 * 全局响应拦截器
 * 统一处理所有API的响应格式
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果响应数据已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
          };
        }

        // 否则包装成标准格式
        return {
          success: true,
          message: this.getSuccessMessage(context),
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  /**
   * 根据请求方法和路径生成默认成功消息
   */
  private getSuccessMessage(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // 可以根据具体业务需求自定义消息
    const methodMessages = {
      GET: '查询成功',
      POST: '创建成功',
      PUT: '更新成功',
      PATCH: '更新成功',
      DELETE: '删除成功',
    };

    return methodMessages[method] || '操作成功';
  }
}
