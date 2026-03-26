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
  responseBody?: any;
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
  responseBody?: any;
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
  private readonly configValueConstant: string = 'true';

  constructor(private readonly configService: ConfigService) {
    this.config = {
      // 详细信息记录配置
      logRequestBody:
        this.configService.get<string>('LOG_REQUEST_BODY') ===
        this.configValueConstant,
      logResponseBody:
        this.configService.get<string>('LOG_RESPONSE_BODY') ===
        this.configValueConstant,
      logRequestHeaders:
        this.configService.get<string>('LOG_REQUEST_HEADERS') ===
        this.configValueConstant,
      logQueryParams:
        this.configService.get<string>('LOG_QUERY_PARAMS') ===
        this.configValueConstant,

      // 性能监控配置
      performanceThreshold: parseInt(
        this.configService.get<string>('PERFORMANCE_THRESHOLD')!,
      ),

      // 敏感字段脱敏
      sensitiveFields: this.configService
        .get<string>('LOG_SENSITIVE_FIELDS')!
        .split(','),
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
      query:
        this.config.logQueryParams &&
        this.isSerializableObject(request.query)
          ? request.query
          : undefined,
      body:
        this.config.logRequestBody &&
        this.isSerializableObject(request.body)
          ? this.sanitizeBody(request.body)
          : undefined,
      headers: this.config.logRequestHeaders
        ? this.sanitizeHeaders(request.headers)
        : undefined,
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    const parts = [
      `方法=${request.method}`,
      `路径=${request.url}`,
      `IP=${logInfo.ip}`,
      `请求ID=${requestId}`,
    ];

    if (logInfo.query) {
      parts.push(`查询参数=${JSON.stringify(logInfo.query)}`);
    }
    if (logInfo.body) {
      parts.push(`请求体=${JSON.stringify(logInfo.body)}`);
    }
    if (logInfo.headers) {
      parts.push(`请求头=${JSON.stringify(logInfo.headers)}`);
    }

    this.logger.log(`[请求开始] ${request.method} ${request.url} - IP地址: ${logInfo.ip} | ${parts.join(' ')}`);
  }

  /**
   * 记录成功响应日志
   */
  logResponse(
    request: Request,
    response: Response,
    responseTime: number,
    requestId?: string,
    responseBody?: any,
  ): void {
    const logInfo: ResponseLogInfo = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      responseTime,
      responseBody:
        this.config.logResponseBody &&
        this.isSerializableObject(responseBody)
          ? this.sanitizeBody(responseBody)
          : undefined,
      timestamp: new Date().toISOString(),
      requestId: requestId,
    };

    const parts = [`状态码=${response.statusCode}`, `耗时=${responseTime}ms`, `请求ID=${requestId || '-'}`];
    if (logInfo.responseBody) {
      parts.push(`响应体=${JSON.stringify(logInfo.responseBody)}`);
    }

    if (responseTime > this.config.performanceThreshold) {
      this.logger.warn(`[慢请求警告] ${request.method} ${request.url} | ${parts.join(' ')}`);
    } else {
      this.logger.log(`[请求完成] ${request.method} ${request.url} | ${parts.join(' ')}`);
    }
  }

  /**
   * 判断值是否为合法的可序列化对象（非 null、非数组、非原始类型）
   */
  private isSerializableObject(value: any): boolean {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  /**
   * 记录错误响应日志
   */
  logError(
    request: Request,
    response: Response,
    responseTime: number,
    error: any,
    requestId?: string,
    responseBody?: any,
  ): void {
    const statusCode = error.status || 500;

    // 安全地提取 responseBody：只处理对象类型
    const sanitizedBody = this.isSerializableObject(responseBody)
      ? this.sanitizeBody(responseBody)
      : responseBody !== undefined && responseBody !== null
        ? String(responseBody)
        : undefined;

    const parts = [
      `状态码=${statusCode}`,
      `耗时=${responseTime}ms`,
      `请求ID=${requestId || '-'}`,
    ];
    if (sanitizedBody !== undefined) {
      parts.push(`响应体=${JSON.stringify(sanitizedBody)}`);
    }

    // error.message 可能为空或为对象（NestJS 某些异常会传对象）
    const errorMsg = typeof error.message === 'string' && error.message
      ? error.message
      : error.name || 'Unknown Error';

    this.logger.error(
      `[请求错误] ${request.method} ${request.url} | ${parts.join(' ')} | 异常类型=${error.name} 错误信息=${errorMsg}`,
    );
  }

  /**
   * 过滤敏感请求头信息
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    this.config.sensitiveFields.forEach((field) => {
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

    this.config.sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: any, context?: any): void {
    this.logger.error(message, context);
  }

  warn(message: any, context?: any): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: any): void {
    this.logger.debug(message, context);
  }

  verbose(message: any, context?: any): void {
    this.logger.verbose(message, context);
  }
}
