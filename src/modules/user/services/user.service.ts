import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { UpdateUserDto } from '@/modules/user/dto';
import { EncryptionService } from '@/modules/user/services/encryption.service';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import { USER_CONSTANTS } from '@/modules/user/constants';
import {
  PublicUser,
  InternalUser,
  UserPaginatedResult,
  UserDeleteResult,
} from '@/modules/user/types/user.types';

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
  async getUserById(id: string): Promise<ApiResponse<PublicUser | null>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id, isActive: true },
        select: USER_CONSTANTS.SELECT_FIELDS.PUBLIC,
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 解密手机号并返回（排除敏感字段）
      const userData = this._getUserWithDecryptedPhone(user);

      return ResponseHelper.success(userData, '用户查询成功');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('用户查询失败，请稍后重试', {
        cause: error,
      });
    }
  }

  /**
   * 辅助方法：返回包含解密手机号的用户信息（排除敏感字段）
   */
  private _getUserWithDecryptedPhone(user: User): PublicUser {
    try {
      const decryptedPhone = this.encryptionService.decryptPhone(user.phone);
      const {
        userId,
        phoneHash,
        verificationCode,
        verificationCodeExpiredAt,
        lastCodeSentAt,
        ...result
      } = user;
      return {
        ...result,
        phone: decryptedPhone,
      };
    } catch (error) {
      throw new InternalServerErrorException('用户数据解密失败', {
        cause: error,
      });
    }
  }

  /**
   * 内部方法：获取包含 userId 的完整用户信息（用于系统内部调用）
   * 仅用于认证和内部业务逻辑，不对外暴露
   */
  async getUserByIdInternal(id: string): Promise<InternalUser | null> {
    try {
      return await this.userRepository.findOne({
        where: { id, isActive: true },
        select: USER_CONSTANTS.SELECT_FIELDS.INTERNAL,
      });
    } catch (error) {
      throw new InternalServerErrorException('用户查询失败，请稍后重试', {
        cause: error,
      });
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<PublicUser | null>> {
    try {
      // 先检查用户是否存在
      const user = await this.userRepository.findOne({
        where: { id, isActive: true },
        select: ['id'], // 只需要检查存在性
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 如果要更新手机号，需要加密处理
      const updateData = { ...updateUserDto };
      if (updateUserDto.phone) {
        updateData.phone = this.encryptionService.encryptPhone(
          updateUserDto.phone,
        );
        // 还需要更新phoneHash用于查询
        updateData['phoneHash'] = this.encryptionService.hashPhone(
          updateUserDto.phone,
        );
      }

      await this.userRepository.update(id, updateData);

      // 获取更新后的用户信息
      const userResult = await this.getUserById(id);
      return ResponseHelper.success(userResult.data, '用户更新成功');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('用户更新失败，请稍后重试', {
        cause: error,
      });
    }
  }

  /**
   * 软删除用户（设置 isActive 为 false）
   */
  async deleteUser(id: string): Promise<ApiResponse<UserDeleteResult>> {
    try {
      // 先检查用户是否存在
      const user = await this.userRepository.findOne({
        where: { id, isActive: true },
        select: ['id'],
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const result = await this.userRepository.update(id, { isActive: false });
      const success = (result.affected ?? 0) > 0;

      if (success) {
        return ResponseHelper.success({ deleted: true }, '用户删除成功');
      } else {
        return ResponseHelper.error('用户删除失败，请稍后重试', {
          deleted: false,
        });
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('用户删除失败，请稍后重试', {
        cause: error,
      });
    }
  }

  /**
   * 获取所有用户（分页）
   */
  async getUserList(
    page: number = USER_CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<ApiResponse<UserPaginatedResult>> {
    try {
      // 限制最大查询数量
      const safeLimit = Math.min(limit, USER_CONSTANTS.PAGINATION.MAX_LIMIT);

      const [users, total] = await this.userRepository.findAndCount({
        where: { isActive: true },
        select: USER_CONSTANTS.SELECT_FIELDS.PUBLIC,
        skip: (page - 1) * safeLimit,
        take: safeLimit,
        order: { createdAt: 'DESC' },
      });

      // 解密所有用户的手机号并排除敏感字段
      const decryptedUsers = users.map((user) =>
        this._getUserWithDecryptedPhone(user),
      );

      return ResponseHelper.paginated(
        decryptedUsers,
        total,
        page,
        safeLimit,
        '用户列表查询成功',
      );
    } catch (error) {
      throw new InternalServerErrorException('用户查询失败，请稍后重试', {
        cause: error,
      });
    }
  }
}
