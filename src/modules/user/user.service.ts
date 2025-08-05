import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@/modules/user/dto';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import * as bcrypt from 'bcrypt';

/**
 * 用户服务
 * 负责用户数据的增删改查操作
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 根据手机号查找用户
   */
  async findByPhone(phone: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { phone, isActive: true } 
    });
  }

  /**
   * 根据ID查找用户（不包含密码）
   */
  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: ['id', 'phone', 'nickname', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    return user;
  }

  /**
   * 创建用户的核心逻辑（私有方法）
   */
  private async _createUser(
    userData: { phone: string; password: string; nickname?: string },
    role: 'user' | 'admin'
  ): Promise<Omit<User, 'password'>> {
    // 检查手机号是否已存在
    const existingUser = await this.findByPhone(userData.phone);
    if (existingUser) {
      throw new ConflictException('手机号已存在');
    }

    // 密码加密
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // 创建用户
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    
    // 返回不包含密码的用户信息
    const { password, ...result } = savedUser;
    return result;
  }

  /**
   * 创建管理员
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    return this._createUser(createUserDto, 'admin');
  }

  /**
   * 用户注册（普通用户）
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    return this._createUser(registerDto, 'user');
  }

  /**
   * 验证用户密码
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  /**
   * 更新用户信息
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Omit<User, 'password'> | null> {
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
    users: Omit<User, 'password'>[];
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

    return {
      users,
      total,
      page,
      limit
    };
  }
}