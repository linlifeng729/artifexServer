/**
 * User模块常量定义
 * 统一管理用户相关的所有硬编码值
 */

/**
 * 用户角色类型
 */
export type UserRole = 'user' | 'admin';

/**
 * 统一的User常量导出
 */
export const USER_CONSTANTS = {
  // 角色定义
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  } as const,

  // 字段长度约束
  CONSTRAINTS: {
    ID_LENGTH: 36,
    PHONE_LENGTH: 255,
    PHONE_HASH_LENGTH: 64,
    NICKNAME_MAX_LENGTH: 50,
    VERIFICATION_CODE_LENGTH: 10,
  } as const,

  // 数据库查询字段配置
  SELECT_FIELDS: {
    // 公开字段（不包含敏感信息）
    PUBLIC: [
      'id',
      'phone',
      'nickname',
      'role',
      'isActive',
      'createdAt',
      'updatedAt',
    ] as (keyof import('@/modules/user/entities/user.entity').User)[],

    // 内部字段（包含userId，用于系统内部）
    INTERNAL: [
      'userId',
      'id',
      'phone',
      'nickname',
      'role',
      'isActive',
      'createdAt',
      'updatedAt',
    ] as (keyof import('@/modules/user/entities/user.entity').User)[],

    // 完整字段（包含加密相关字段）
    FULL: [
      'userId',
      'id',
      'phone',
      'phoneHash',
      'nickname',
      'role',
      'isActive',
      'createdAt',
      'updatedAt',
    ] as (keyof import('@/modules/user/entities/user.entity').User)[],
  },

  // 默认分页配置
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  } as const,

  // 手机号验证正则表达式
  VALIDATION: {
    PHONE_REGEX: /^1[3-9]\d{9}$/,
  } as const,
} as const;
