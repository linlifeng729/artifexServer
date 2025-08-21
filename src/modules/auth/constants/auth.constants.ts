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
    CLEANUP_INTERVAL_MINUTES: 5,
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
      CODE_INDEX: 0,
      EXPIRATION_INDEX: 1,
      EXPIRATION_MINUTES: '5',
    },
  },
  
  // 错误消息
  ERROR_MESSAGES: {
    PHONE_INVALID: '请输入正确的手机号格式',
    CODE_INVALID: '验证码必须是6位数字',
    CODE_EXPIRED: '验证码已过期，请重新获取',
    CODE_WRONG: '验证码错误',
    CODE_NOT_EXIST: '请先获取验证码',
    USER_NOT_EXIST: '用户不存在',
    TOKEN_INVALID: '无效的访问令牌',
    TOKEN_MISSING: '访问令牌缺失',
    PERMISSION_DENIED: '权限不足，请联系管理员',
    USER_INFO_MISSING: '用户信息缺失',
    SMS_SEND_FAILED: '验证码发送失败，请稍后重试',
    SMS_SEND_TOO_FREQUENT: '请等待{seconds}秒后再重新发送验证码',
    LOGIN_FAILED: '手机号或验证码错误',
    USER_REGISTRATION_FAILED: '用户信息完善失败',
    USER_INFO_FETCH_FAILED: '用户信息获取失败',
  },
  
  // 成功消息
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: '登录成功',
    CODE_SENT: '验证码发送成功',
    CODE_VERIFIED: '验证码验证成功',
  },
} as const;

// 导出类型以便 TypeScript 类型检查
export type AuthRole = typeof AUTH_CONSTANTS.ROLES[keyof typeof AUTH_CONSTANTS.ROLES];
