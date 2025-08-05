import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { User } from '@/modules/user/entities/user.entity';

/**
 * 用户模块
 * 包含用户相关的所有功能：控制器、服务、实体等
 */
@Module({
  imports: [
    // 注册用户实体
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 导出服务供其他模块使用（如认证模块）
})
export class UserModule {}