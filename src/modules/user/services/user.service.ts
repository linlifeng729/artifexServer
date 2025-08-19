import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { UpdateUserDto } from '@/modules/user/dto';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { ResponseHelper, ApiResponse } from '@/common';

/**
 * 用户服务
 * 负责用户数据的增删改查操作
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * 根据ID查找用户（不包含敏感字段，返回解密后的手机号）
   */
  async findById(id: string): Promise<ApiResponse<Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'> | null>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id, isActive: true },
        select: ['id', 'phone', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt']
      });
      
      if (!user) {
        return ResponseHelper.error('用户不存在', null);
      }

      // 解密手机号并返回
      const decryptedPhone = this.encryptionService.decryptPhone(user.phone);
      const userData = {
        ...user,
        phone: decryptedPhone
      };
      
      return ResponseHelper.success(userData, '用户查询成功');
    } catch (error) {
      throw new Error('用户查询失败，请稍后重试');
    }
  }

  /**
   * 完善用户注册信息（首次登录时调用）
   * 将临时用户转为正式用户
   */
  async completeUserRegistration(userId: string, nickname?: string): Promise<Omit<User, 'verificationCode' | 'verificationCodeExpiredAt'>> {
    try {
      // 查找用户
      const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 检查用户是否已经完成注册
      if (user.role) {
        // 用户已经完成注册，返回解密后的用户信息
        return this._getUserWithDecryptedPhone(user);
      }

      // 完善用户信息，设置为普通用户
      const updateData: Partial<User> = { role: 'user' };
      if (nickname) {
        updateData.nickname = nickname;
      }
      
      await this.userRepository.update(userId, updateData);

      // 重新查询更新后的用户信息
      const updatedUser = await this.userRepository.findOne({ 
        where: { id: userId, isActive: true },
        select: ['id', 'phone', 'phoneHash', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt']
      });
      if (!updatedUser) {
        throw new NotFoundException('用户信息更新失败');
      }

      return this._getUserWithDecryptedPhone(updatedUser);
    } catch (error) {
      throw new Error('用户注册完善失败，请稍后重试');
    }
  }

  /**
   * 辅助方法：返回包含解密手机号的用户信息
   */
  private _getUserWithDecryptedPhone(user: User): Omit<User, 'verificationCode' | 'verificationCodeExpiredAt'> {
    try {
      const decryptedPhone = this.encryptionService.decryptPhone(user.phone);
      const { verificationCode, verificationCodeExpiredAt, ...result } = user;
      return {
        ...result,
        phone: decryptedPhone
      };
    } catch (error) {
      throw new Error('用户数据解密失败');
    }
  }

  /**
   * 更新用户信息
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<ApiResponse<Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'> | null>> {
    try {
      const user = await this.userRepository.findOne({ where: { id, isActive: true } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      await this.userRepository.update(id, updateUserDto);

      const userResult = await this.findById(id);
      if (userResult.success) {
        return ResponseHelper.success(userResult.data, '用户更新成功');
      } else {
        return userResult; // 直接返回错误响应
      }
    } catch (error) {
      throw new Error('用户更新失败，请稍后重试');
    }
  }

  /**
   * 软删除用户（设置 isActive 为 false）
   */
  async softDelete(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const result = await this.userRepository.update(id, { isActive: false });
      const success = (result.affected ?? 0) > 0;

      if (success) {
        return ResponseHelper.success({ deleted: true }, '用户删除成功');
      } else {
        return ResponseHelper.error('用户删除失败', { deleted: false });
      }
    } catch (error) {
      return ResponseHelper.error('用户删除失败，请稍后重试', { deleted: false });
    }
  }

  /**
   * 获取所有用户（分页）
   */
  async findAll(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    items: Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      select: ['id', 'phone', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // 解密所有用户的手机号
    const decryptedUsers = users.map(user => {
      return {
        ...user,
        phone: this.encryptionService.decryptPhone(user.phone)
      };
    });

    return ResponseHelper.paginated(decryptedUsers, total, page, limit, '用户列表查询成功');
  }
}