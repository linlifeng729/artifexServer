import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'], // 启用所有日志级别，包括debug
  });
  
  // 配置全局 Logger
  const globalLogger = new Logger();
  app.useLogger(globalLogger);
  
  // 配置全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 自动转换请求参数类型
    whitelist: true, // 只保留DTO中定义的属性
    forbidNonWhitelisted: true, // 如果请求中包含DTO中未定义的属性，则抛出错误
  }));

  await app.listen(12600, '0.0.0.0');
}
bootstrap();
