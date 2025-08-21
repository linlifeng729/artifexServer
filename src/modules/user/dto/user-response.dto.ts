/**
 * 用户响应数据传输对象
 */
import { USER_CONSTANTS } from '@/modules/user/constants';

/**
 * 用户基础响应DTO
 */
export class UserResponseDto {
  /**
   * 用户UUID
   */
  id: string;

  /**
   * 手机号（解密后）
   */
  phone: string;

  /**
   * 用户昵称
   */
  nickname?: string;

  /**
   * 用户角色
   */
  role: typeof USER_CONSTANTS.ROLES[keyof typeof USER_CONSTANTS.ROLES];

  /**
   * 是否激活
   */
  isActive: boolean;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;

  constructor(user: any) {
    this.id = user.id;
    this.phone = user.phone;
    this.nickname = user.nickname;
    this.role = user.role;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

/**
 * 用户分页响应DTO
 */
export class UserPaginatedResponseDto {
  /**
   * 用户列表
   */
  items: UserResponseDto[];

  /**
   * 总数量
   */
  total: number;

  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页数量
   */
  limit: number;

  /**
   * 总页数
   */
  totalPages: number;

  constructor(data: {
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }) {
    this.items = data.items.map(user => new UserResponseDto(user));
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.totalPages = data.totalPages;
  }
}

/**
 * 用户删除响应DTO
 */
export class UserDeleteResponseDto {
  /**
   * 是否删除成功
   */
  deleted: boolean;

  constructor(deleted: boolean) {
    this.deleted = deleted;
  }
}
