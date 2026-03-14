import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggingService } from '@/common/services/logging.service';

/**
 * 通用模块
 * 提供全局通用服务
 */
@Global()
@Module({
  imports: [HttpModule],
  providers: [LoggingService],
  exports: [LoggingService, HttpModule],
})
export class CommonModule {}
