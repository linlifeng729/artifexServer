import * as crypto from 'crypto';
import type {
  HashAlgorithm,
  SignAlgorithm,
  CryptoEncoding,
  EncryptionResult,
  AESAlgorithm,
} from '@/common/types/crypto';
import {
  HASH_ALGORITHMS,
  SIGN_ALGORITHMS,
  ENCODINGS,
  AES_ALGORITHMS,
  AES_CONFIG,
  PRIVATE_KEY_FORMAT,
  PRIVATE_KEY_TYPE,
  PRIVATE_KEY_EXPORT_OPTIONS,
} from '@/common/types/crypto';

export class ICrypto {
  /**
   * @description 生成指定长度的唯一随机字符串
   * @param {number} length 字符串长度，默认为16
   * @returns {string} 生成的唯一随机字符串
   */
  static generateRandomString(length: number = 16): string {
    const timestamp = Date.now().toString(36);
    const remainingLength = Math.max(0, length - timestamp.length);
    const bytes = Math.ceil(remainingLength / 2);

    return (
      timestamp + crypto.randomBytes(bytes).toString(ENCODINGS.HEX)
    ).slice(0, length);
  }

  /**
   * @description 生成加密安全的随机字节
   * @param {number} size 字节数
   * @param {CryptoEncoding} encoding 编码格式
   * @returns {string} 随机字节字符串
   */
  static generateSecureRandom(
    size: number = 32,
    encoding: CryptoEncoding = ENCODINGS.HEX,
  ): string {
    return crypto.randomBytes(size).toString(encoding);
  }

  /**
   * @description 生成UUID v4
   * @returns {string} UUID字符串
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * @description 创建 Hmac 签名
   * @param {string | Buffer} data 要签名的数据
   * @param {string} key 密钥
   * @param {HashAlgorithm} algorithm 哈希算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {string} 生成的签名
   * @example 示例代码
   * const signature = ICrypto.createHmac(signatureOrigin, secret, HASH_ALGORITHMS.SHA256, ENCODINGS.BASE64)
   */
  static createHmac(
    data: string | Buffer,
    key: string,
    algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): string {
    const hmac = crypto.createHmac(algorithm, key);
    hmac.update(data);
    return hmac.digest(encoding);
  }

  /**
   * @description 验证 Hmac 签名
   * @param {string | Buffer} originalData 原始签名的数据
   * @param {string} key 密钥
   * @param {string} signature 原始 Hmac 签名
   * @param {HashAlgorithm} algorithm 哈希算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {boolean} 签名是否有效
   * @example 示例代码
   * const isValidSignature = ICrypto.verifyHmac(signatureOrigin, secret, signature, HASH_ALGORITHMS.SHA256, ENCODINGS.BASE64)
   */
  static verifyHmac(
    originalData: string | Buffer,
    key: string,
    signature: string,
    algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): boolean {
    const newHmac = this.createHmac(originalData, key, algorithm, encoding);
    return crypto.timingSafeEqual(
      Buffer.from(newHmac, encoding),
      Buffer.from(signature, encoding),
    );
  }

  /**
   * @description 创建 Hash 签名
   * @param {string | Buffer} data 要签名的数据
   * @param {HashAlgorithm} algorithm 哈希算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {string} 生成的签名
   * @example 示例代码
   * const signature = ICrypto.createHash(data, HASH_ALGORITHMS.SHA256, ENCODINGS.HEX)
   */
  static createHash(
    data: string | Buffer,
    algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
    encoding: CryptoEncoding = ENCODINGS.HEX,
  ): string {
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    return hash.digest(encoding);
  }

  /**
   * @description 验证 Hash 签名
   * @param {string | Buffer} data 要签名的数据
   * @param {string} signature 原始 Hash 签名
   * @param {HashAlgorithm} algorithm 哈希算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {boolean} 签名是否有效
   * @example 示例代码
   * const isValidSignature = ICrypto.verifyHash(data, signature, HASH_ALGORITHMS.SHA256, ENCODINGS.HEX)
   */
  static verifyHash(
    data: string | Buffer,
    signature: string,
    algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
    encoding: CryptoEncoding = ENCODINGS.HEX,
  ): boolean {
    return this.createHash(data, algorithm, encoding) === signature;
  }

  /**
   * @description 创建 Sign 签名
   * @param {string | Buffer} data 要签名的数据
   * @param {string} privateKey 私钥字符串
   * @param {SignAlgorithm} algorithm 签名算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {string} 生成的签名
   * @example 示例代码
   * const signature = ICrypto.createSign(data, privateKey, SIGN_ALGORITHMS.RSA_SHA256, ENCODINGS.BASE64)
   */
  static createSign(
    data: string | Buffer,
    privateKey: string,
    algorithm: SignAlgorithm = SIGN_ALGORITHMS.RSA_SHA256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): string {
    const sign = crypto.createSign(algorithm);
    sign.update(data);
    return sign.sign(privateKey, encoding);
  }

  /**
   * @description 验证 Sign 签名
   * @param {string | Buffer} originalData 原始签名的数据
   * @param {string} signature 原始 Sign 签名
   * @param {string} publicKey 公钥字符串
   * @param {SignAlgorithm} algorithm 签名算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {boolean} 签名是否有效
   * @example 示例代码
   * const isValidSignature = ICrypto.verifySign(originalData, signature, publicKey, SIGN_ALGORITHMS.RSA_SHA256, ENCODINGS.BASE64)
   */
  static verifySign(
    originalData: string | Buffer,
    signature: string,
    publicKey: string,
    algorithm: SignAlgorithm = SIGN_ALGORITHMS.RSA_SHA256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): boolean {
    const verify = crypto.createVerify(algorithm);
    verify.update(originalData);
    return verify.verify(publicKey, signature, encoding);
  }

  /**
   * @description 从 base64 编码的 DER 数据创建私钥 KeyObject（PKCS#8 格式）
   * @param {string} privateKeyBase64 base64 编码的私钥
   * @returns {crypto.KeyObject} 私钥对象
   * @example
   * const privateKey = ICrypto.createPrivateKeyFromBase64('MIIEvQIBADANBgk...')
   */
  static createPrivateKeyFromBase64(
    privateKeyBase64: string,
  ): crypto.KeyObject {
    const keyBuffer = Buffer.from(privateKeyBase64, 'base64');
    return crypto.createPrivateKey({
      key: keyBuffer,
      format: PRIVATE_KEY_FORMAT,
      type: PRIVATE_KEY_TYPE,
    });
  }

  /**
   * @description 使用 KeyObject 私钥创建签名（自动处理格式转换）
   * @param {string | Buffer} data 要签名的数据
   * @param {crypto.KeyObject} privateKey 私钥对象
   * @param {SignAlgorithm} algorithm 签名算法
   * @param {CryptoEncoding} encoding 输出编码格式
   * @returns {string} 生成的签名
   * @example
   * const privateKey = ICrypto.createPrivateKeyFromBase64('MIIEvQIBADANBgk...')
   * const signature = ICrypto.createSignWithKeyObject(data, privateKey, SIGN_ALGORITHMS.RSA_SHA256, ENCODINGS.BASE64)
   */
  static createSignWithKeyObject(
    data: string | Buffer,
    privateKey: crypto.KeyObject,
    algorithm: SignAlgorithm = SIGN_ALGORITHMS.RSA_SHA256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): string {
    const pem = privateKey.export(PRIVATE_KEY_EXPORT_OPTIONS) as string;
    return this.createSign(data, pem, algorithm, encoding);
  }

  /**
   * @description AES加密
   * @param {string | Buffer} data 要加密的数据
   * @param {string} key 密钥
   * @param {AESAlgorithm} algorithm AES算法
   * @param {CryptoEncoding} encoding 编码格式
   * @returns {EncryptionResult} 包含加密后的文本和初始向量的对象
   * @example
   * const result = ICrypto.aesEncrypt('hello world', 'mySecretKey', AES_ALGORITHMS.CBC_256, ENCODINGS.BASE64)
   */
  static aesEncrypt(
    data: string | Buffer,
    key: string,
    algorithm: AESAlgorithm = AES_ALGORITHMS.CBC_256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): EncryptionResult {
    // 生成随机的初始化向量
    const iv = crypto.randomBytes(AES_CONFIG.IV_SIZE);

    // 使用 scrypt 生成密钥
    const keyBuffer = crypto.scryptSync(
      key,
      AES_CONFIG.SALT,
      AES_CONFIG.KEY_SIZE,
    );

    // 创建加密器
    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

    // 加密数据
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const encryptedBuffers = [cipher.update(dataBuffer), cipher.final()];

    // 合并加密结果并编码
    return {
      encrypted: Buffer.concat(encryptedBuffers).toString(
        encoding as BufferEncoding,
      ),
      iv: iv.toString(encoding as BufferEncoding),
    };
  }

  /**
   * @description AES解密
   * @param {EncryptionResult} encryptedData 包含加密后的文本和初始向量的对象
   * @param {string} key 密钥
   * @param {AESAlgorithm} algorithm AES算法
   * @param {CryptoEncoding} encoding 编码格式
   * @returns {string} 解密后的文本
   * @example
   * const decrypted = ICrypto.aesDecrypt({
   *   encrypted: 'base64EncodedString',
   *   iv: 'base64EncodedIV'
   * }, 'mySecretKey', AES_ALGORITHMS.CBC_256, ENCODINGS.BASE64)
   */
  static aesDecrypt(
    encryptedData: EncryptionResult,
    key: string,
    algorithm: AESAlgorithm = AES_ALGORITHMS.CBC_256,
    encoding: CryptoEncoding = ENCODINGS.BASE64,
  ): string {
    // 解码初始化向量和加密数据
    const iv = Buffer.from(encryptedData.iv, encoding as BufferEncoding);
    const encrypted = Buffer.from(
      encryptedData.encrypted,
      encoding as BufferEncoding,
    );

    // 使用相同的参数生成密钥
    const keyBuffer = crypto.scryptSync(
      key,
      AES_CONFIG.SALT,
      AES_CONFIG.KEY_SIZE,
    );

    // 创建解密器
    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);

    // 解密数据
    const decryptedBuffers = [decipher.update(encrypted), decipher.final()];

    // 解密结果
    return Buffer.concat(decryptedBuffers).toString('utf8');
  }
}
