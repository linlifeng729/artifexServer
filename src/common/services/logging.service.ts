import { Injectable, LoggerService, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 请求日志信息接口
 */
export interface RequestLogInfo {
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  query?: any;
  body?: any;
  headers?: any;
  timestamp: string;
  requestId?: string;
}

/**
 * 响应日志信息接口
 */
export interface ResponseLogInfo {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  requestId?: string;
}

/**
 * 错误日志信息接口
 */
export interface ErrorLogInfo {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * 高级日志服务
 * 提供结构化的日志记录和格式化功能
 */
@Injectable()
export class LoggingService implements LoggerService {
  private readonly logger = new Logger('HTTP');
  private readonly config: any;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      // 详细信息记录配置
      logRequestBody: this.configService.get<boolean>('LOG_REQUEST_BODY', false),
      logResponseBody: this.configService.get<boolean>('LOG_RESPONSE_BODY', false),
      logRequestHeaders: this.configService.get<boolean>('LOG_REQUEST_HEADERS', false),
      logQueryParams: this.configService.get<boolean>('LOG_QUERY_PARAMS', false),

      // 性能监控配置
      performanceThreshold: this.configService.get<number>('PERFORMANCE_THRESHOLD', 2000),

      // 敏感字段脱敏
      sensitiveFields: this.configService.get<string>('LOG_SENSITIVE_FIELDS')!.split(','),
    };
  }

  /**
   * 记录请求日志
   */
  logRequest(request: Request, requestId?: string): void {
    const logInfo: RequestLogInfo = {
      method: request.method,
      url: request.url,
      ip: request.ip || 'unknown',
      userAgent: request.headers['user-agent'],
      query: this.config.logQueryParams && Object.keys(request.query).length > 0 ? request.query : undefined,
      body: this.config.logRequestBody && Object.keys(request.body || {}).length > 0 ? this.sanitizeBody(request.body) : undefined,
      headers: this.config.logRequestHeaders ? this.sanitizeHeaders(request.headers) : undefined,
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    this.logger.log(
      `[请求开始] ${request.method} ${request.url} - IP地址: ${logInfo.ip}`,
      logInfo
    );
  }

  /**
   * 记录成功响应日志
   */
  logResponse(request: Request, response: Response, responseTime: number, requestId?: string): void {
    const logInfo: ResponseLogInfo = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      responseTime,
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    // 检查是否为慢请求
    if (responseTime > this.config.performanceThreshold) {
      this.logger.warn(
        `[慢请求警告] ${request.method} ${request.url} - 状态码: ${response.statusCode} (响应时间: ${responseTime}ms)`,
        logInfo
      );
    } else {
      this.logger.log(
        `[请求完成] ${request.method} ${request.url} - 状态码: ${response.statusCode} (响应时间: ${responseTime}ms)`,
        logInfo
      );
    }
  }

  /**
   * 记录错误响应日志
   */
  logError(request: Request, response: Response, responseTime: number, error: any, requestId?: string): void {
    const logInfo: ErrorLogInfo = {
      method: request.method,
      url: request.url,
      statusCode: error.status || 500,
      responseTime,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    this.logger.error(
      `[请求错误] ${request.method} ${request.url} - 状态码: ${logInfo.statusCode} (响应时间: ${responseTime}ms) - 错误信息: ${error.message}`,
      logInfo
    );
  }

  /**
   * 过滤敏感请求头信息
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    
    this.config.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * 过滤敏感请求体信息
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }
    
    const sanitized = { ...body };
    
    this.config.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // LoggerService 接口实现
  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: string): void {
    this.logger.verbose(message, context);
  }
}
