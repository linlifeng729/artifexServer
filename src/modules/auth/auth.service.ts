import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { UserService } from '@/modules/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const { phone, password } = loginDto;
    
    // 从数据库查找用户
    const user = await this.userService.findByPhone(phone);

    if (user && await this.userService.validatePassword(user, password)) {
      const { password: _, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);
    
    if (!user) {
      return {
        success: false,
        message: '手机号或密码错误',
        data: null
      };
    }

    // 生成JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload);

    return {
      success: true,
      message: '登录成功',
      data: {
        user,
        token
      }
    };
  }

  // 用户注册后自动登录
  async registerAndLogin(registerDto: RegisterDto) {
    try {
      // 注册用户
      const user = await this.userService.register(registerDto);
      
      // 自动登录，生成token
      const payload = { sub: user.id, phone: user.phone };
      const token = await this.jwtService.signAsync(payload);
      
      return {
        success: true,
        message: '注册成功',
        data: {
          user,
          token
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '注册失败',
        data: null
      };
    }
  }

  // 验证JWT token
  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return {
        success: true,
        data: payload
      };
    } catch (error) {
      return {
        success: false,
        message: 'Token无效或已过期',
        data: null
      };
    }
  }
}