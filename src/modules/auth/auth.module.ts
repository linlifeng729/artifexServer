import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/services/auth.service';
import { UserModule } from '@/modules/user/user.module';
import { TencentSmsService } from '@/modules/auth/services/tencent-sms.service';
import { User } from '@/modules/user/entities/user.entity';
import { AuthRateLimitGuard } from '@/modules/auth/guards/auth-rate-limit.guard';

/**
 * 认证模块
 * 处理用户认证、登录、JWT验证等功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 导入User实体
    UserModule, // 导入用户模块以使用用户服务
  ],
  controllers: [AuthController],
  providers: [AuthService, TencentSmsService, AuthRateLimitGuard],
  exports: [AuthService], // 导出供其他模块使用
})
export class AuthModule {}
