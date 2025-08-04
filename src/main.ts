import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 自动转换请求参数类型
    whitelist: true, // 只保留DTO中定义的属性
    forbidNonWhitelisted: true, // 如果请求中包含DTO中未定义的属性，则抛出错误
  }));
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
