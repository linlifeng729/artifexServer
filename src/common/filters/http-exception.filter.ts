import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { LoggingService } from '../services/logging.service';

/**
 * 全局异常过滤器
 * 统一处理所有异常并返回标准格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exception.message;
      }
    } else if (exception instanceof Error) {
      this.loggingService.error(
        `${request.method} ${request.url} - 未捕获异常: [${exception.name}] ${exception.message}\n${exception.stack}`,
      );
      message = '服务内部错误';
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    this.loggingService.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
    );

    response.status(status).json({
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }
}
