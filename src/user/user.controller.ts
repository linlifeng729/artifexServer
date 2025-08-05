import { Controller, Get, Post, Body, HttpCode, Request } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../auth/public.decorator';

@Controller('api')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
  
  @Get('profile')
  @HttpCode(200)
  async getProfile(@Request() req) {
    return {
      success: true,
      message: '获取用户信息成功',
      data: {
        user: req.user,
      },
    };
  }
} 