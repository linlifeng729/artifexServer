import { Module } from '@nestjs/common';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { UserModule } from '@/modules/user/user.module';

/**
 * 认证模块
 * 处理用户认证、登录、JWT验证等功能
 */
@Module({
  imports: [
    UserModule, // 导入用户模块以使用用户服务
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard], // 导出供其他模块使用
})
export class AuthModule {}