import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt.guard';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 自动转换请求参数类型
    whitelist: true, // 只保留DTO中定义的属性
    forbidNonWhitelisted: true, // 如果请求中包含DTO中未定义的属性，则抛出错误
  }));

  // 配置全局 JWT Guard
  const reflector = app.get(Reflector);
  const authService = app.get(AuthService);
  app.useGlobalGuards(new JwtAuthGuard(authService, reflector));
  
  await app.listen(12600, '0.0.0.0');
}
bootstrap();
