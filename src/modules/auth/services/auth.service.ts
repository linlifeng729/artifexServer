import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { SendVerificationCodeDto } from '@/modules/auth/dto/send-verificationcode.dto';
import { UserService } from '@/modules/user/services/user.service';
import { VerificationCodeService } from '@/modules/auth/services/verification-code.service';
import { ResponseHelper, ApiResponse } from '@/common';
import { AUTH_CONSTANTS } from '@/modules/auth/constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  async login(loginDto: LoginDto): Promise<ApiResponse<{ user: any, token: string }>> {
    const { phone, verificationCode: inputCode } = loginDto;
    
    // 验证验证码
    const verifyResult = await this.verificationCodeService.verifyCode(phone, inputCode);
    
    if (!verifyResult.success || !verifyResult.data) {
      throw new BadRequestException(verifyResult.message || '手机号或验证码错误');
    }

    let user = verifyResult.data;

    // 检查用户是否已完成注册（通过role字段判断）
    if (!user.role) {
      try {
        await this.userService.completeUserRegistration(user.id);
        // 重新获取包含 userId 的完整用户信息
        const fullUser = await this.userService.findByIdInternal(user.id);
        if (!fullUser) {
          throw new InternalServerErrorException('用户信息获取失败');
        }
        user = fullUser;
      } catch (error) {
        throw new InternalServerErrorException('用户信息完善失败');
      }
    }

    // 根据用户角色设置token有效期
    const expiresIn = user.role === AUTH_CONSTANTS.ROLES.ADMIN 
      ? AUTH_CONSTANTS.JWT.ADMIN_EXPIRATION 
      : AUTH_CONSTANTS.JWT.USER_EXPIRATION;

    // 生成JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = await this.jwtService.signAsync(payload, { expiresIn });

    // 返回不包含敏感字段的用户信息（排除 userId、phoneHash 等内部字段）
    const { userId, phoneHash, ...result } = user;

    return ResponseHelper.success({
      user: result,
      token
    }, '登录成功');
  }

  // 发送验证码
  async sendVerificationCode(sendCodeDto: SendVerificationCodeDto): Promise<ApiResponse<boolean>> {
    return await this.verificationCodeService.sendVerificationCode(sendCodeDto.phone);
  }

  /**
   * 验证JWT token并获取用户信息
   * @param token JWT token
   * @returns 用户信息
   * @throws BadRequestException 当token无效时
   * @throws InternalServerErrorException 当用户信息获取失败时
   */
  async verifyToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      
      // 根据 JWT payload 中的用户ID获取完整的用户信息（包含 userId 用于内部业务）
      const user = await this.userService.findByIdInternal(payload.sub);
      
      if (!user) {
        throw new InternalServerErrorException('用户不存在');
      }
      
      return user;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new BadRequestException('无效的访问令牌');
    }
  }
}