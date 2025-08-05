import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const { username, password } = loginDto;
    
    // 从数据库查找用户
    const user = await this.userService.findByUsername(username);

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

  // 用户注册
  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      return {
        success: true,
        message: '注册成功',
        data: { user }
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