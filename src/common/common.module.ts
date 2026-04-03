import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingService } from '@/common/services/logging.service';
import { RedisLockService } from '@/common/services/redis-lock.service';
import { EncryptionService } from '@/common/services/encryption.service';

/**
 * 通用模块
 * 提供全局通用服务
 *
 * 分布式锁使用 RedisLockService（Redlock + Redis 实现）
 * 适用于 K8s 多副本部署，性能优于基于数据库的锁方案
 */
@Global()
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([], 'default')],
  providers: [LoggingService, RedisLockService, EncryptionService],
  exports: [LoggingService, RedisLockService, EncryptionService, HttpModule],
})
export class CommonModule {}
