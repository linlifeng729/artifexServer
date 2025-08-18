import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
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
   * 发送验证码
   */
  @Public()
  @Post('send/verificationcode')
  @HttpCode(200)
  async sendVerificationCode(@Body() sendCodeDto: SendVerificationCodeDto) {
    return await this.authService.sendVerificationCode(sendCodeDto);
  }
}