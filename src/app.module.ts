// NestJS 核心装饰器和依赖注入相关
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 配置管理模块
import { JwtModule } from '@nestjs/jwt';                      // JWT 认证模块
import { TypeOrmModule } from '@nestjs/typeorm';             // TypeORM 数据库 ORM 模块
import { APP_GUARD } from '@nestjs/core';                    // 全局守卫注册令牌

// 应用控制器和模块
import { AppController } from './app.controller';            // 根控制器
import { UserModule } from './modules/user/user.module';     // 用户管理模块
import { AuthModule } from './modules/auth/auth.module';     // 认证模块
import { JwtAuthGuard } from './modules/auth/jwt.guard';     // JWT 认证守卫
import { User } from './modules/user/entities/user.entity';  // 用户实体

/**
 * 应用根模块 (App Root Module)
 * 
 * 作为 NestJS 应用的入口点，负责：
 * - 整合所有功能模块、控制器和服务提供者
 * - 配置全局服务（数据库、JWT、配置管理等）
 * - 设置全局守卫和拦截器
 * - 建立模块间的依赖关系
 */
@Module({
  imports: [
    // ========== 配置管理模块 ==========
    ConfigModule.forRoot({
      isGlobal: true,        // 设为全局模块，避免在其他模块中重复导入
      ignoreEnvFile: false,  // 启用 .env 文件读取，支持环境变量配置
      envFilePath: ['.env'], // 指定环境变量文件路径，支持多环境配置
    }),

    // ========== 数据库连接配置 ==========
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],    // 注入配置服务，实现动态配置
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',            // 数据库类型：MySQL
        host: configService.get<string>('DB_HOST', 'localhost'),           // 数据库主机地址
        port: configService.get<number>('DB_PORT', 3306),                  // 数据库端口号
        username: configService.get<string>('DB_USERNAME', 'root'),        // 数据库用户名
        password: configService.get<string>('DB_PASSWORD', ''),            // 数据库密码
        database: configService.get<string>('DB_DATABASE', 'artifex'),     // 数据库名称
        entities: [User],         // 注册实体类，TypeORM 会自动扫描这些实体
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),  // 是否自动同步数据库结构（生产环境应设为 false）
        logging: configService.get<boolean>('DB_LOGGING', false),          // 是否开启 SQL 查询日志
      }),
    }),

    // ========== JWT 认证模块配置 ==========
    JwtModule.registerAsync({
      global: true,                    // 设为全局模块，便于在整个应用中使用
      inject: [ConfigService],         // 注入配置服务
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),  // JWT 签名密钥，必须在环境变量中配置
        signOptions: { expiresIn: '24h' },                // JWT 令牌有效期：24小时
      }),
    }),

    // ========== 业务功能模块 ==========
    UserModule,    // 用户管理模块：用户 CRUD、用户信息查询等
    AuthModule,    // 认证模块：登录、注册、权限验证等
  ],

  // ========== 根级控制器 ==========
  controllers: [
    AppController,  // 应用根控制器，处理基础路由（如健康检查、API 信息等）
  ],

  // ========== 全局服务提供者 ==========
  providers: [
    // 全局 JWT 认证守卫
    // 自动保护所有路由，除非使用 @Public() 装饰器标记为公开
    {
      provide: APP_GUARD,      // 全局守卫注册令牌
      useClass: JwtAuthGuard,  // 使用 JWT 认证守卫类
    },
  ],
})
/**
 * AppModule 类导出
 * NestJS 应用的根模块类，作为应用的入口点
 */
export class AppModule { }
