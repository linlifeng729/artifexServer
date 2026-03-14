// 常用算法常量
export const HASH_ALGORITHMS = {
  SHA1: 'sha1',
  SHA256: 'sha256',
  SHA512: 'sha512',
  MD5: 'md5'
} as const

export const SIGN_ALGORITHMS = {
  RSA_SHA256: 'RSA-SHA256',
  RSA_SHA512: 'RSA-SHA512',
  ECDSA_SHA256: 'sha256'
} as const

export const ENCODINGS = {
  HEX: 'hex',
  BASE64: 'base64',
  BASE64URL: 'base64url'
} as const

// AES 加密算法常量
export const AES_ALGORITHMS = {
  CBC_256: 'aes-256-cbc',
  GCM_256: 'aes-256-gcm',
  CTR_256: 'aes-256-ctr',
  CBC_192: 'aes-192-cbc',
  CBC_128: 'aes-128-cbc'
} as const

// AES 加密配置常量
export const AES_CONFIG = {
  KEY_SIZE: 32,
  IV_SIZE: 16,
  SALT: 'salt'
} as const

// 密钥格式常量
export const PEM_PRIVATE_KEY_HEADER = '-----BEGIN PRIVATE KEY-----'
export const PEM_PRIVATE_KEY_FOOTER = '-----END PRIVATE KEY-----'
export const PRIVATE_KEY_FORMAT = 'der' as const
export const PRIVATE_KEY_TYPE = 'pkcs8' as const
export const PRIVATE_KEY_EXPORT_OPTIONS = { type: 'pkcs1' as const, format: 'pem' as const }

// 从常量生成的类型
export type HashAlgorithm = typeof HASH_ALGORITHMS[keyof typeof HASH_ALGORITHMS]
export type SignAlgorithm = typeof SIGN_ALGORITHMS[keyof typeof SIGN_ALGORITHMS]
export type CryptoEncoding = typeof ENCODINGS[keyof typeof ENCODINGS]
export type AESAlgorithm = typeof AES_ALGORITHMS[keyof typeof AES_ALGORITHMS]

// 加密结果接口
export interface EncryptionResult {
  encrypted: string
  iv: string
}