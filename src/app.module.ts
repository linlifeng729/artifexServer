import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from '@/app.controller';
import { CommonModule } from '@/common/common.module';
import { BusinessModule } from '@/modules/business.module';
import { appProviders } from '@/app.providers';

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

    // 全局限流模块（默认：每 60 秒 100 次请求，防止暴力破解）
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 100,
            name: 'default',
          },
        ],
      }),
    }),

    // 数据库配置
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        autoLoadEntities: true,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        timezone: configService.get<string>('DB_TIMEZONE'),
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
        logging: configService.get<boolean>('DB_LOGGING'),
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

    // 通用模块
    CommonModule,

    // 业务模块
    BusinessModule,
  ],

  controllers: [AppController],

  providers: appProviders,
})
export class AppModule {}
