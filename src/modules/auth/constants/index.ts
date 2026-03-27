/**
 * 认证模块常量定义
 * 统一管理认证相关的常量，避免硬编码
 */
export const AUTH_CONSTANTS = {
    // ===== 验证码相关 =====
    VERIFICATION_CODE: {
      LENGTH: 6,
      EXPIRATION_MINUTES: 5,
      SEND_INTERVAL_SECONDS: 60,
    },
  
    // ===== JWT 相关 =====
    JWT: {
      ADMIN_EXPIRATION: '7d',
      USER_EXPIRATION: '30d',
      BEARER_PREFIX: 'Bearer',
    },
  
    // ===== 密码学安全 =====
    SECURITY: {
      /** bcrypt 哈希轮数 */
      BCRYPT_SALT_ROUNDS: 10,
      /** Redis 分布式锁 TTL（毫秒） */
      SMS_LOCK_TTL_MS: 30000,
    },
  
    // ===== 手机号验证 =====
    /** DTO 验证直接引用此正则，Auth 模块权威来源 */
    PHONE: {
      REGEX: /^1[3-9]\d{9}$/,
      INTERNATIONAL_PREFIX: '+86',
    },
  
    // ===== 角色定义（引用 USER_CONSTANTS.ROLES）=====
    /** @deprecated 请使用 USER_CONSTANTS.ROLES */
    ROLES: {
      ADMIN: 'admin',
      USER: 'user',
    },
  
    // ===== 短信模板参数 =====
    SMS: {
      TEMPLATE_PARAMS: {
        EXPIRATION_MINUTES: '5',
      },
    },
  
    // ===== 极验滑块验证码配置 =====
    GEETEST: {
      VALIDATE_PATH: '/validate',
    },
  } as const;
  