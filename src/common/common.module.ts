import { Global, Module } from '@nestjs/common';
import { LoggingService } from '@/common/services/logging.service';

/**
 * 通用模块
 * 提供全局通用服务
 */
@Global()
@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class CommonModule {}
