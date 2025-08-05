import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { UserModule } from '../user/user.module';

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