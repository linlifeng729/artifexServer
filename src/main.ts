import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // 安全中间件 - Helmet
  app.use(helmet());

  // 开启 Express 信任代理，以便正确获取真实客户端 IP
  // 在 Nginx/CDN 网关后面运行时必须开启，否则 X-Forwarded-For 会被忽略
  // NestJS 需要通过 getHttpAdapter 访问底层 Express 实例
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance().set('trust proxy', 1);

  // CORS 配置 - 防止跨站攻击
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',')?.map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 预检请求缓存 24 小时
  });

  // 配置全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 配置 Swagger 文档
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Artifex API')
    .setDescription('Artifex API docs')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: '输入 JWT Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(12600, '0.0.0.0');
}
bootstrap();
