import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from '@/modules/auth/services/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { Public } from '@/modules/auth/decorators';
import { AuthRateLimitGuard } from '@/modules/auth/guards/auth-rate-limit.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { VerifyCodeSuccessData } from '@/modules/auth/types';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求：登录、注册等
 */
@ApiTags('认证模块')
@Controller('api/auth')
@SkipThrottle() // 跳过全局宽松限流，由 AuthRateLimitGuard 提供精细化限流
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   *
   * @param loginDto 登录数据传输对象，包含手机号和验证码
   */
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: '用户登录' })
  @SwaggerApiResponse({ status: 200, description: '登录成功' })
  @SwaggerApiResponse({ status: 429, description: '请求过于频繁' })
  @Post('login')
  @HttpCode(200)
  async userLogin(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponse<{ user: VerifyCodeSuccessData; token: string }>> {
    return await this.authService.userLogin(loginDto);
  }

  /**
   * 发送验证码
   * 需要先通过滑块验证码校验
   * @param sendCodeDto 发送验证码数据传输对象，包含手机号和滑块验证码
   */
  @Public()
  @UseGuards(AuthRateLimitGuard)
  @ApiOperation({ summary: '发送验证码' })
  @SwaggerApiResponse({ status: 200, description: '短信发送成功' })
  @SwaggerApiResponse({ status: 429, description: '请求过于频繁' })
  @Post('send/verificationcode')
  @HttpCode(200)
  async sendSmsCode(
    @Body() sendCodeDto: SendVerificationCodeDto,
  ): Promise<ApiResponse<boolean>> {
    return await this.authService.sendSmsCode(sendCodeDto);
  }
}
