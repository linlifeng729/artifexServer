/**
 * 认证模块常量定义
 * 统一管理认证相关的常量，避免硬编码
 */

export const AUTH_CONSTANTS = {
  // 验证码相关
  VERIFICATION_CODE: {
    LENGTH: 6,
    EXPIRATION_MINUTES: 5,
    SEND_INTERVAL_SECONDS: 60,
  },
  
  // JWT 相关
  JWT: {
    ADMIN_EXPIRATION: '1d',      // 管理员：1天
    USER_EXPIRATION: '30d',      // 用户：1个月
    BEARER_PREFIX: 'Bearer',
  },
  
  // 手机号验证
  PHONE: {
    REGEX: /^1[3-9]\d{9}$/,
    INTERNATIONAL_PREFIX: '+86',
  },
  
  // 角色定义
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },
  
  // 短信模板参数
  SMS: {
    TEMPLATE_PARAMS: {
      EXPIRATION_MINUTES: '5',
    },
  },
} as const;


