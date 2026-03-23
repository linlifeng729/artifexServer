import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

/**
 * 分布式锁服务
 * 使用数据库实现，支持锁获取、释放、续期
 */
@Injectable()
export class DistributedLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly ownerId: string;
  private readonly lockTableName = 'distributed_locks';
  private readonly defaultTtlMs = 30000; // 默认 30 秒过期
  private readonly retryIntervalMs = 100; // 重试间隔
  private readonly maxRetries = 50; // 最大重试次数

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.ownerId = `${process.pid}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async onModuleInit(): Promise<void> {
    await this.ensureLockTableExists();
    this.startAutoCleanup();
  }

  async onModuleDestroy(): Promise<void> {
    await this.releaseAllLocks();
  }

  /**
   * 确保锁表存在
   */
  private async ensureLockTableExists(): Promise<void> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      const tableExists = await queryRunner.hasTable(this.lockTableName);
      if (!tableExists) {
        await queryRunner.query(`
          CREATE TABLE ${this.lockTableName} (
            lock_key VARCHAR(255) NOT NULL PRIMARY KEY,
            owner_id VARCHAR(255) NOT NULL,
            expire_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_expire_at (expire_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分布式锁记录表'
        `);
        this.logger.log(`锁表 ${this.lockTableName} 创建成功`);
      }

      await queryRunner.release();
    } catch (error) {
      this.logger.error(`创建锁表失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取分布式锁
   * @param lockKey 锁的 key
   * @param ttlMs 锁的过期时间（毫秒）
   * @param retryCount 最大重试次数
   * @returns 是否获取成功
   */
  async acquireLock(
    lockKey: string,
    ttlMs: number = this.defaultTtlMs,
    retryCount: number = this.maxRetries,
  ): Promise<boolean> {
    const startTime = Date.now();

    for (let i = 0; i < retryCount; i++) {
      const now = new Date();
      const expireAt = new Date(now.getTime() + ttlMs);

      try {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // 尝试插入新锁记录（INSERT IGNORE）
          await queryRunner.query(
            `INSERT IGNORE INTO ${this.lockTableName} (lock_key, owner_id, expire_at) VALUES (?, ?, ?)`,
            [lockKey, this.ownerId, expireAt],
          );

          // 检查是否获取到锁（可能是新插入的，也可能是已存在的未过期的）
          const [lock] = await queryRunner.query(
            `SELECT * FROM ${this.lockTableName} WHERE lock_key = ? AND (owner_id = ? OR expire_at > NOW()) FOR UPDATE`,
            [lockKey, this.ownerId],
          );

          if (lock && lock.owner_id === this.ownerId) {
            await queryRunner.commitTransaction();
            await queryRunner.release();
            return true;
          }

          await queryRunner.rollbackTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      } catch (error) {
        this.logger.debug(
          `获取锁 ${lockKey} 失败，重试中... (${i + 1}/${retryCount})`,
        );
      }

      // 等待后重试
      await this.sleep(this.retryIntervalMs);
    }

    this.logger.warn(
      `获取锁 ${lockKey} 超时，耗时 ${Date.now() - startTime}ms`,
    );
    return false;
  }

  /**
   * 释放分布式锁
   * @param lockKey 锁的 key
   */
  async releaseLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
        `DELETE FROM ${this.lockTableName} WHERE lock_key = ? AND owner_id = ?`,
        [lockKey, this.ownerId],
      );

      return result.affectedRows > 0;
    } catch (error) {
      this.logger.error(`释放锁 ${lockKey} 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 释放当前进程持有的所有锁
   */
  async releaseAllLocks(): Promise<void> {
    try {
      const result = await this.dataSource.query(
        `DELETE FROM ${this.lockTableName} WHERE owner_id = ?`,
        [this.ownerId],
      );

      if (result.affectedRows > 0) {
        this.logger.log(`释放了 ${result.affectedRows} 个锁`);
      }
    } catch (error) {
      this.logger.error(`释放所有锁失败: ${error.message}`);
    }
  }

  /**
   * 续期锁
   * @param lockKey 锁的 key
   * @param ttlMs 延长的过期时间（毫秒）
   */
  async extendLock(
    lockKey: string,
    ttlMs: number = this.defaultTtlMs,
  ): Promise<boolean> {
    try {
      const expireAt = new Date(Date.now() + ttlMs);
      const result = await this.dataSource.query(
        `UPDATE ${this.lockTableName} SET expire_at = ? WHERE lock_key = ? AND owner_id = ?`,
        [expireAt, lockKey, this.ownerId],
      );

      return result.affectedRows > 0;
    } catch (error) {
      this.logger.error(`续期锁 ${lockKey} 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 执行带锁的业务逻辑
   * @param lockKey 锁的 key
   * @param ttlMs 锁的过期时间（毫秒）
   * @param fn 要执行的业务逻辑
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
      throw new Error(`无法获取锁: ${lockKey}`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey);
    }
  }

  /**
   * 启动自动清理过期锁的任务
   */
  private startAutoCleanup(): void {
    // 每 10 秒清理一次过期锁
    setInterval(async () => {
      try {
        const result = await this.dataSource.query(
          `DELETE FROM ${this.lockTableName} WHERE expire_at < NOW()`,
        );
        if (result.affectedRows > 0) {
          this.logger.debug(`清理了 ${result.affectedRows} 个过期锁`);
        }
      } catch (error) {
        this.logger.error(`清理过期锁失败: ${error.message}`);
      }
    }, 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
