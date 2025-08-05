import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';
import { CreateUserDto } from '../user/dto';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求：登录、注册等
 */
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   */
  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  /**
   * 用户登录
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}