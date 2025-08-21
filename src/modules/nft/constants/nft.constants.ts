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
 * 错误消息常量
 */
export const NFT_ERROR_MESSAGES = {
  // NFT相关错误
  NFT_NAME_EXISTS: 'NFT名称已存在',
  NFT_NOT_FOUND: 'NFT不存在',
  NFT_TYPE_NOT_FOUND_OR_INACTIVE: 'NFT类型不存在或已下架',
  NFT_LIST_QUERY_FAILED: 'NFT列表查询失败，请稍后重试',
  
  // NFT实例相关错误
  NFT_INSTANCE_NOT_FOUND: 'NFT商品不存在',
  NFT_INSTANCE_CREATE_QUERY_FAILED: 'NFT实例创建后查询失败',
  NFT_INSTANCE_LIST_QUERY_FAILED: 'NFT商品列表查询失败，请稍后重试',
  
  // 验证错误消息
  VALIDATION: {
    NAME_REQUIRED: 'NFT名称不能为空',
    NAME_STRING: 'NFT名称必须是字符串',
    NAME_MAX_LENGTH: `NFT名称不能超过${NFT_CONSTRAINTS.NAME_MAX_LENGTH}个字符`,
    
    IMAGE_REQUIRED: 'NFT图片URL不能为空',
    IMAGE_STRING: 'NFT图片URL必须是字符串',
    IMAGE_URL_FORMAT: 'NFT图片URL格式不正确',
    IMAGE_MAX_LENGTH: `NFT图片URL不能超过${NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH}个字符`,
    
    TYPE_REQUIRED: 'NFT类型不能为空',
    TYPE_STRING: 'NFT类型必须是字符串',
    TYPE_MAX_LENGTH: `NFT类型不能超过${NFT_CONSTRAINTS.TYPE_MAX_LENGTH}个字符`,
    
    NFT_ID_REQUIRED: 'NFT类型ID不能为空',
    NFT_ID_INTEGER: 'NFT类型ID必须是整数',
    
    PRICE_REQUIRED: '价格不能为空',
    PRICE_INTEGER: '价格必须是整数',
    PRICE_MIN: `价格必须大于${NFT_CONSTRAINTS.MIN_PRICE - 1}`,
    
    STATUS_INVALID: '状态值无效',
    NFT_STATUS_INVALID: `NFT状态只能是${NFT_STATUS_VALUES.join('或')}`,
    NFT_INSTANCE_STATUS_INVALID: `NFT实例状态只能是${NFT_INSTANCE_STATUS_VALUES.join('、')}`,
  },
} as const;

/**
 * 成功消息常量
 */
export const NFT_SUCCESS_MESSAGES = {
  // NFT相关成功消息
  NFT_CREATED: 'NFT创建成功',
  NFT_FOUND: 'NFT查询成功',
  NFT_LIST_FOUND: 'NFT列表查询成功',
  NFT_LIST_BY_STATUS_FOUND: (status: string) => `状态为${status}的NFT列表查询成功`,
  
  // NFT实例相关成功消息
  NFT_INSTANCE_CREATED: 'NFT商品发布成功',
  NFT_INSTANCE_FOUND: 'NFT商品详情查询成功',
  NFT_INSTANCE_LIST_FOUND: 'NFT商品列表查询成功',
  NFT_INSTANCE_LIST_BY_STATUS_FOUND: (status: string) => `状态为${status}的NFT商品列表查询成功`,
} as const;
