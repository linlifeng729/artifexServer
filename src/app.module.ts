import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt.guard';

/**
 * 应用根模块
 * 负责整合应用的所有功能模块、控制器和服务提供者
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,        // 全局可用，其他模块无需重复导入
      ignoreEnvFile: false,  // 不忽略 .env 文件
      envFilePath: ['.env'], // 指定环境变量文件路径
    }),
    // JWT模块异步配置
    JwtModule.registerAsync({
      global: true,                    // 全局可用
      inject: [ConfigService],         // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // 从环境变量获取JWT密钥
        signOptions: { expiresIn: '24h' },               // JWT令牌24小时后过期
      }),
    }),
  ],
  // 控制器注册 - 处理HTTP请求和响应
  controllers: [AppController, UserController],
  // 服务提供者注册 - 业务逻辑和功能服务
  providers: [AuthService, JwtAuthGuard],
})
export class AppModule { }
