import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { Public } from '@/modules/auth/decorators/public.decorator';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求：登录、注册等
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /**
   * 用户注册并自动登录
   */
  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.registerAndLogin(registerDto);
  }
}