import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { UserService } from '@/modules/user/services/user.service';
import { VerificationCodeService } from '@/modules/auth/services/verification-code.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  async login(loginDto: LoginDto) {
    const { phone, verificationCode } = loginDto;
    
    // 验证验证码
    const verifyResult = await this.verificationCodeService.verifyCode(phone, verificationCode);
    
    if (!verifyResult.success || !verifyResult.user) {
      return {
        success: false,
        message: verifyResult.message || '手机号或验证码错误',
        data: null
      };
    }

    let user = verifyResult.user;

    // 检查用户是否已完成注册（通过role字段判断）
    if (!user.role) {
      try {
        const updatedUser = await this.userService.completeUserRegistration(user.id);
        user = updatedUser;
      } catch (error) {
        return {
          success: false,
          message: '用户信息完善失败',
          data: null
        };
      }
    }

    // 生成JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload);

    // 返回不包含敏感字段的用户信息  
    const { phoneHash: _, ...result } = user;

    return {
      success: true,
      message: '登录成功',
      data: {
        user: result,
        token
      }
    };
  }

  // 发送验证码
  async sendVerificationCode(sendCodeDto: SendVerificationCodeDto) {
    return await this.verificationCodeService.sendVerificationCode(sendCodeDto.phone);
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