import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from '@/modules/auth/services/auth.service';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { Public } from '@/modules/auth/decorators';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求：登录、注册等
 */
@ApiTags('认证模块')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户登录
   *
   * @param loginDto 登录数据传输对象，包含手机号和验证码
   */
  @Public()
  @ApiOperation({ summary: '用户登录' })
  @SwaggerApiResponse({ status: 200, description: '登录成功' })
  @Post('login')
  @HttpCode(200)
  async userLogin(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponse<{ user: unknown; token: string }>> {
    return await this.authService.userLogin(loginDto);
  }

  /**
   * 发送验证码
   * 需要先通过滑块验证码校验
   * @param sendCodeDto 发送验证码数据传输对象，包含手机号和滑块验证码
   */
  @Public()
  @ApiOperation({ summary: '发送验证码' })
  @SwaggerApiResponse({ status: 200, description: '验证码发送成功' })
  @Post('send/verificationcode')
  @HttpCode(200)
  async sendSmsCode(
    @Body() sendCodeDto: SendVerificationCodeDto,
  ): Promise<ApiResponse<boolean>> {
    return await this.authService.sendSmsCode(sendCodeDto);
  }
}
