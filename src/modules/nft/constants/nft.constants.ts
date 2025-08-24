/**
 * NFT模块常量定义
 * 统一管理所有NFT相关的常量、枚举和配置
 */

/**
 * NFT状态枚举
 */
export const NFT_STATUS = {
  ACTIVE: 'active' as const,
  INACTIVE: 'inactive' as const,
} as const;

/**
 * NFT实例状态枚举
 */
export const NFT_INSTANCE_STATUS = {
  AVAILABLE: 'available' as const,
  SOLD: 'sold' as const,
  RESERVED: 'reserved' as const,
} as const;

/**
 * NFT状态类型定义
 */
export type NftStatus = typeof NFT_STATUS[keyof typeof NFT_STATUS];

/**
 * NFT实例状态类型定义
 */
export type NftInstanceStatus = typeof NFT_INSTANCE_STATUS[keyof typeof NFT_INSTANCE_STATUS];

/**
 * 状态枚举数组（用于验证）
 */
export const NFT_STATUS_VALUES = Object.values(NFT_STATUS);
export const NFT_INSTANCE_STATUS_VALUES = Object.values(NFT_INSTANCE_STATUS);

/**
 * 字段长度限制
 */
export const NFT_CONSTRAINTS = {
  NAME_MAX_LENGTH: 100,
  IMAGE_URL_MAX_LENGTH: 500,
  TYPE_MAX_LENGTH: 100,
  MIN_PRICE: 1,
} as const;

/**
 * 分页相关限制
 */
export const PAGINATION_CONSTRAINTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const;
