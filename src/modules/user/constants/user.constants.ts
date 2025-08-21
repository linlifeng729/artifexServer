/**
 * User模块常量定义
 * 统一管理用户相关的所有硬编码值
 */

/**
 * 用户角色枚举
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

/**
 * 用户角色类型
 */
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

/**
 * 字段长度约束
 */
export const USER_CONSTRAINTS = {
  ID_LENGTH: 36,
  PHONE_LENGTH: 255,
  PHONE_HASH_LENGTH: 64,
  NICKNAME_MAX_LENGTH: 50,
  VERIFICATION_CODE_LENGTH: 10,
} as const;

/**
 * 数据库查询字段配置
 */
export const USER_SELECT_FIELDS = {
  // 公开字段（不包含敏感信息）
  PUBLIC: [
    'id', 
    'phone', 
    'nickname', 
    'role', 
    'isActive', 
    'createdAt', 
    'updatedAt'
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
    'updatedAt'
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
    'updatedAt'
  ] as (keyof import('@/modules/user/entities/user.entity').User)[],
};

/**
 * 错误消息常量
 */
export const USER_ERROR_MESSAGES = {
  USER_NOT_FOUND: '用户不存在',
  USER_QUERY_FAILED: '用户查询失败，请稍后重试',
  USER_UPDATE_FAILED: '用户更新失败，请稍后重试',
  USER_DELETE_FAILED: '用户删除失败，请稍后重试',
  USER_REGISTRATION_FAILED: '用户注册完善失败，请稍后重试',
  USER_DECRYPT_FAILED: '用户数据解密失败',
  PHONE_ENCRYPTION_FAILED: '手机号加密失败',
  PHONE_DECRYPTION_FAILED: '手机号解密失败',
  PHONE_FORMAT_INVALID: '请输入正确的手机号格式',
  NICKNAME_TOO_LONG: `昵称长度不能超过${USER_CONSTRAINTS.NICKNAME_MAX_LENGTH}位`,
  ROLE_INVALID: `角色必须是 ${USER_ROLES.USER} 或 ${USER_ROLES.ADMIN}`,
} as const;

/**
 * 成功消息常量
 */
export const USER_SUCCESS_MESSAGES = {
  USER_FOUND: '用户查询成功',
  USER_UPDATED: '用户更新成功',
  USER_DELETED: '用户删除成功',
  USER_LIST_FOUND: '用户列表查询成功',
  USER_REGISTRATION_COMPLETED: '用户注册完善成功',
} as const;

/**
 * 默认分页配置
 */
export const USER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

/**
 * 手机号验证正则表达式
 */
export const USER_VALIDATION = {
  PHONE_REGEX: /^1[3-9]\d{9}$/,
} as const;

/**
 * 统一的User常量导出
 */
export const USER_CONSTANTS = {
  ROLES: USER_ROLES,
  CONSTRAINTS: USER_CONSTRAINTS,
  SELECT_FIELDS: USER_SELECT_FIELDS,
  ERROR_MESSAGES: USER_ERROR_MESSAGES,
  SUCCESS_MESSAGES: USER_SUCCESS_MESSAGES,
  PAGINATION: USER_PAGINATION,
  VALIDATION: USER_VALIDATION,
} as const;
