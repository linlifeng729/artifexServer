import { ApiResponse } from '@/common/interceptors/response.interceptor';

/**
 * 响应格式辅助工具类
 * 统一封装API响应格式
 */
export class ResponseHelper {
  /**
   * 创建成功响应
   */
  static success<T>(data: T, message: string = '操作成功'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建失败响应
   */
  static error<T = null>(message: string, data: T = null as T): ApiResponse<T> {
    return {
      success: false,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建分页响应
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message: string = '查询成功'
  ): ApiResponse<{
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.success(
      {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      message
    );
  }
}
