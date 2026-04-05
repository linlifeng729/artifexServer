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
    MAX_RETRIES: 3,
    TIMEOUT_MS: 5000,
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

  /** 腾讯云短信错误码映射：key 为腾讯云错误码，user 为用户看到的提示，log 为日志记录 */
  SMS_ERROR_CODES: {
    'LimitExceeded.PhoneNumberDailyLimit': {
      user: '该手机号今日发送次数已用完，请明天再试',
      log: '单个手机号日下发短信条数超过上限',
    },
    'LimitExceeded.PhoneNumberOneHourLimit': {
      user: '该手机号发送次数超限，请稍后再试',
      log: '单个手机号1小时内下发短信条数超过上限',
    },
    'LimitExceeded.PhoneNumberSameContentDailyLimit': {
      user: '该手机号相同内容发送次数超限，请更换内容或明天再试',
      log: '单个手机号下发相同内容超过上限',
    },
    'LimitExceeded.PhoneNumberThirtySecondLimit': {
      user: '请求过于频繁，请稍后重试',
      log: '单个手机号30秒内下发短信条数超过上限',
    },
  } as const,
} as const;
