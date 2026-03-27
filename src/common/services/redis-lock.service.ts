import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

/**
 * 基于 Redlock + Redis 的分布式锁服务
 * 适用于 K8s 多副本部署场景，提供高性能、高可用的分布式锁能力
 */
@Injectable()
export class RedisLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly defaultTtlMs = 30000; // 默认 30 秒过期
  private readonly retryCount = 3; // Redlock 重试次数
  private readonly retryDelayMs = 200; // 重试间隔（毫秒）
  private readonly retryJitterMs = 100; // 重试随机抖动（毫秒）

  private redisClient!: Redis;
  private redlock!: Redlock;
  private activeLocks: Map<string, Lock> = new Map();

  private readonly config: {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
  };

  constructor(private readonly configService: ConfigService) {
    this.config = this.getRedisConfig();
  }

  /**
   * @description 获取 Redis 配置
   * @returns {Object} 包含 host、port、password、db、keyPrefix 的配置对象
   * @throws InternalServerErrorException 当配置缺失时抛出异常
   */
  private getRedisConfig(): {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
  } {
    const requiredConfigs = ['REDIS_HOST', 'REDIS_PORT'];

    const missingConfigs = requiredConfigs.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missingConfigs.length > 0) {
      throw new InternalServerErrorException(
        `[Redis 分布式锁] 配置缺失: ${missingConfigs.join(', ')}`,
      );
    }

    return {
      host: this.configService.get<string>('REDIS_HOST')!,
      port: this.configService.get<number>('REDIS_PORT')!,
      password: this.configService.get<string>('REDIS_PASSWORD')!,
      db: this.configService.get<number>('REDIS_DB')!,
      keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX')!,
    };
  }

  async onModuleInit(): Promise<void> {
    await this.initRedisClient();
    this.logger.log(
      `Redis 分布式锁服务初始化完成，keyPrefix: ${this.config.keyPrefix}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.releaseAllLocks();
    this.redisClient?.disconnect();
    this.logger.log('Redis 分布式锁服务已关闭');
  }

  private async initRedisClient(): Promise<void> {
    const { host, port, password, db, keyPrefix } = this.config;

    const options: Record<string, any> = {
      host,
      port,
      db,
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis 连接重试超过 3 次，停止重连');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      maxRetriesPerRequest: 3,
    };

    if (password) {
      options.password = password;
    }

    this.redisClient = new Redis(options);

    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis 连接错误: ${err.message}`);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis 连接成功');
    });

    // 等待连接就绪
    await new Promise<void>((resolve, reject) => {
      if (this.redisClient.status === 'ready') {
        resolve();
        return;
      }

      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const onClose = () => {
        cleanup();
        reject(new Error('Redis 连接已关闭'));
      };

      const cleanup = () => {
        this.redisClient.removeListener('ready', onReady);
        this.redisClient.removeListener('error', onError);
        this.redisClient.removeListener('close', onClose);
      };

      this.redisClient.on('ready', onReady);
      this.redisClient.on('error', onError);
      this.redisClient.on('close', onClose);
    });

    // 初始化 Redlock
    this.redlock = new Redlock([this.redisClient], {
      driftFactor: 0.01, // 时钟漂移因子
      retryCount: this.retryCount,
      retryDelay: this.retryDelayMs,
      retryJitter: this.retryJitterMs,
      automaticExtensionThreshold: 500, // 超过 500ms 的任务自动续期
    });

    this.redlock.on('error', (error) => {
      // 忽略锁扩展失败的警告（expected）
      if (error.name !== 'ExecutionError') {
        this.logger.error(`Redlock 错误: ${error.message}`);
      }
    });
  }

  /**
   * 获取分布式锁
   * @param lockKey 锁的 key
   * @param ttlMs 锁的过期时间（毫秒）
   * @param retryCount 重试次数（已由 Redlock 内部接管，此参数保留兼容性）
   * @returns 是否获取成功
   */
  async acquireLock(
    lockKey: string,
    ttlMs: number = this.defaultTtlMs,
    retryCount?: number,
  ): Promise<boolean> {
    const fullKey = this.buildKey(lockKey);
    const duration = Math.ceil(ttlMs / 1000); // Redlock 需要秒为单位的 duration

    try {
      const lock = await this.redlock.acquire([fullKey], duration * 1000);

      this.activeLocks.set(fullKey, lock);

      this.logger.debug(`获取锁成功: ${fullKey}, TTL: ${duration}s`);
      return true;
    } catch (error: any) {
      if (error.name === 'ExecutionError') {
        this.logger.debug(`获取锁失败（已被持有）: ${fullKey}`);
      } else {
        this.logger.warn(`获取锁异常: ${fullKey}, 错误: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * 释放分布式锁
   * @param lockKey 锁的 key
   */
  async releaseLock(lockKey: string): Promise<boolean> {
    const fullKey = this.buildKey(lockKey);

    const lock = this.activeLocks.get(fullKey);
    if (lock) {
      try {
        await lock.release();
        this.activeLocks.delete(fullKey);
        this.logger.debug(`释放锁成功: ${fullKey}`);
        return true;
      } catch (error: any) {
        this.logger.warn(`释放锁异常: ${fullKey}, 错误: ${error.message}`);
        this.activeLocks.delete(fullKey);
        return false;
      }
    }

    return false;
  }

  /**
   * 释放当前实例持有的所有锁
   */
  async releaseAllLocks(): Promise<void> {
    const keys = [...this.activeLocks.keys()];
    if (keys.length === 0) return;

    this.logger.log(`正在释放 ${keys.length} 个锁...`);

    const results = await Promise.allSettled(
      [...this.activeLocks.values()].map((lock) => lock.release()),
    );

    const failedCount = results.filter((r) => r.status === 'rejected').length;
    this.activeLocks.clear();

    if (failedCount > 0) {
      this.logger.warn(`释放所有锁完成，失败 ${failedCount} 个`);
    } else {
      this.logger.log(`释放所有锁完成，成功释放 ${keys.length} 个`);
    }
  }

  /**
   * 续期锁（Redlock 自动续期已覆盖大多数场景，此方法保留用于手动续期）
   * @param lockKey 锁的 key
   * @param ttlMs 延长的过期时间（毫秒）
   */
  async extendLock(
    lockKey: string,
    ttlMs: number = this.defaultTtlMs,
  ): Promise<boolean> {
    const fullKey = this.buildKey(lockKey);
    const lock = this.activeLocks.get(fullKey);

    if (!lock) {
      this.logger.warn(`续期锁失败，锁不存在: ${fullKey}`);
      return false;
    }

    try {
      await lock.extend(ttlMs);
      this.logger.debug(`续期锁成功: ${fullKey}, 延长 ${ttlMs}ms`);
      return true;
    } catch (error: any) {
      this.logger.warn(`续期锁异常: ${fullKey}, 错误: ${error.message}`);
      return false;
    }
  }

  /**
   * 执行带锁的业务逻辑（推荐使用方式）
   * @param lockKey 锁的 key
   * @param fn 要执行的业务逻辑
   * @param ttlMs 锁的过期时间（毫秒）
   * @returns 业务逻辑的返回值
   * @throws 如果无法获取锁，抛出错误
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs,
  ): Promise<T> {
    const acquired = await this.acquireLock(lockKey, ttlMs);
    if (!acquired) {
      throw new Error(`无法获取分布式锁: ${lockKey}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * 获取 Redis 客户端（用于测试或高级用途）
   */
  getRedisClient(): Redis {
    return this.redisClient;
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}lock:${key}`;
  }
}
