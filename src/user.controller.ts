import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('api')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
} 