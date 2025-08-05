import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt.guard';
import { User } from './modules/user/entities/user.entity';

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
    // TypeORM数据库配置
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'artifex'),
        entities: [User],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true), // 生产环境应设为 false
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
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
    // 功能模块
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局JWT守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
