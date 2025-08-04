import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 模拟用户数据 - 在实际项目中应该从数据库获取
  private readonly users = [
    { id: 1, username: 'admin', password: 'admin123' },
    { id: 2, username: 'user', password: 'user123' },
  ];

  async validateUser(loginDto: LoginDto) {
    const { username, password } = loginDto;
    
    // 查找用户
    const user = this.users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
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
        message: '用户名或密码错误',
        data: null
      };
    }

    // 生成JWT token
    const payload = { sub: user.id, username: user.username };
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