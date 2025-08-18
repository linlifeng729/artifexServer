import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { UpdateUserDto } from '@/modules/user/dto';

import { EncryptionService } from '@/modules/user/services/encryption.service';

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
  async findById(id: number): Promise<Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'> | null> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: ['id', 'phone', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return null;
    }

    // 解密手机号并返回
    try {
      const decryptedPhone = this.encryptionService.decryptPhone(user.phone);
      return {
        ...user,
        phone: decryptedPhone
      };
    } catch (error) {
      // 如果解密失败，返回null或抛出异常
      throw new Error('用户数据解密失败');
    }
  }

  /**
   * 完善用户注册信息（首次登录时调用）
   * 将临时用户转为正式用户
   */
  async completeUserRegistration(userId: number, nickname?: string): Promise<Omit<User, 'verificationCode' | 'verificationCodeExpiredAt'>> {
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
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'> | null> {
    const user = await this.userRepository.findOne({ where: { id, isActive: true } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  /**
   * 软删除用户（设置 isActive 为 false）
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await this.userRepository.update(id, { isActive: false });
    return (result.affected ?? 0) > 0;
  }

  /**
   * 获取所有用户（分页）
   */
  async findAll(page: number = 1, limit: number = 10): Promise<{
    users: Omit<User, 'phoneHash' | 'verificationCode' | 'verificationCodeExpiredAt'>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      select: ['id', 'phone', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // 解密所有用户的手机号
    const decryptedUsers = users.map(user => {
      try {
        const decryptedPhone = this.encryptionService.decryptPhone(user.phone);
        return {
          ...user,
          phone: decryptedPhone
        };
      } catch (error) {
        return {
          ...user,
          phone: '***解密失败***'
        };
      }
    });

    return {
      users: decryptedUsers,
      total,
      page,
      limit
    };
  }
}