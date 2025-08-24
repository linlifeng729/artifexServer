import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/services/auth.service';
import { VerificationCodeService } from '@/modules/auth/services/verification-code.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { UserModule } from '@/modules/user/user.module';
import { TencentSmsService } from '@/modules/auth/services/tencent-sms.service';
import { User } from '@/modules/user/entities/user.entity';

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
  providers: [AuthService, VerificationCodeService, TencentSmsService, JwtAuthGuard],
  exports: [AuthService, VerificationCodeService, JwtAuthGuard], // 导出供其他模块使用
})
export class AuthModule {}