/** 认证模块常量定义 */
export const AUTH_CONSTANTS = {
  VERIFICATION_CODE: {
    LENGTH: 6,
    EXPIRATION_MINUTES: 5,
    SEND_INTERVAL_SECONDS: 60,
    MAX_ATTEMPTS: 5,
    INITIAL_ATTEMPTS: 0,
  },

  JWT: {
    ADMIN_EXPIRATION: '7d',
    USER_EXPIRATION: '30d',
    BEARER_PREFIX: 'Bearer',
  },

  SECURITY: {
    BCRYPT_SALT_ROUNDS: 10,
    SMS_LOCK_TTL_MS: 60000,
  },

  PHONE: {
    REGEX: /^1[3-9]\d{9}$/,
    INTERNATIONAL_PREFIX: '+86',
  },

  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
  },

  SMS: {
    TEMPLATE_PARAMS: {
      EXPIRATION_MINUTES: '5',
    },
  },

  GEETEST: {
    VALIDATE_PATH: '/validate',
  },

  /** 登录限流：5分钟内最多尝试5次 */
  LOGIN_RATE_LIMIT: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 300000,
  },

  /** 发送验证码限流：同一IP+手机号1分钟1次；同一IP最多3次/分钟 */
  SEND_CODE_RATE_LIMIT: {
    MAX_ATTEMPTS: 1,
    WINDOW_MS: 60000,
    IP_MULTIPLIER: 3,
  },
} as const;
