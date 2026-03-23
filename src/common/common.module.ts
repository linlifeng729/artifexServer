import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingService } from '@/common/services/logging.service';
import { DistributedLockService } from '@/common/services/distributed-lock.service';

/**
 * 通用模块
 * 提供全局通用服务
 */
@Global()
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([], 'default')],
  providers: [LoggingService, DistributedLockService],
  exports: [LoggingService, DistributedLockService, HttpModule],
})
export class CommonModule {}
