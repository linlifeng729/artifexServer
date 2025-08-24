import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 全局异常过滤器
 * 统一处理所有异常并返回标准格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
      }
    } else if (exception instanceof Error) {
      // 处理普通错误（如Service层抛出的Error）
      message = exception.message;
      status = HttpStatus.BAD_REQUEST;
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // 返回统一的错误响应格式
    response.status(status).json({
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
