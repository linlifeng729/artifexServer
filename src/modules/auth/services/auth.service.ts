import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { UserService } from '@/modules/user/services/user.service';
import { VerificationCodeService } from '@/modules/auth/services/verification-code.service';
import { ResponseHelper, ApiResponse } from '@/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  async login(loginDto: LoginDto): Promise<ApiResponse<{ user: any, token: string }>> {
    const { phone, verificationCode } = loginDto;
    
    // 验证验证码
    const verifyResult = await this.verificationCodeService.verifyCode(phone, verificationCode);
    
    if (!verifyResult.success || !verifyResult.data) {
      // 抛出异常，让全局异常过滤器处理
      throw new Error(verifyResult.message || '手机号或验证码错误');
    }

    let user = verifyResult.data;

    // 检查用户是否已完成注册（通过role字段判断）
    if (!user.role) {
      try {
        const updatedUser = await this.userService.completeUserRegistration(user.id);
        user = updatedUser;
      } catch (error) {
        throw new Error('用户信息完善失败');
      }
    }

    // 生成JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload);

    // 返回不包含敏感字段的用户信息  
    const { phoneHash: _, ...result } = user;

    return ResponseHelper.success({
      user: result,
      token
    }, '登录成功');
  }

  // 发送验证码
  async sendVerificationCode(sendCodeDto: SendVerificationCodeDto): Promise<ApiResponse<boolean>> {
    return await this.verificationCodeService.sendVerificationCode(sendCodeDto.phone);
  }

  // 验证JWT token
  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // 根据 JWT payload 中的用户ID获取完整的用户信息
      const user = await this.userService.findById(payload.sub);
      
      if (!user) {
        throw new Error('用户不存在或已被禁用');
      }
      
      return user;
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }
}