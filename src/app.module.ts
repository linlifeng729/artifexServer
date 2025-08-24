import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { AppController } from '@/app.controller';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { NftModule } from '@/modules/nft/nft.module';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { LoggingService } from '@/common/services/logging.service';
import { User } from '@/modules/user/entities/user.entity';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';

/**
 * 应用根模块
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: ['.env.development', '.env'],
    }),

    // 定时任务模块
    ScheduleModule.forRoot(),

    // 数据库配置
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'artifex'),
        entities: [User, Nft, NftInstance],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
    }),

    // JWT 配置
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),

    // 业务模块
    UserModule,
    AuthModule,
    NftModule,
  ],

  controllers: [
    AppController,
  ],

  providers: [
    Logger,
    LoggingService,
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局日志拦截器（必须在响应拦截器之前）
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 全局响应拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule { }
