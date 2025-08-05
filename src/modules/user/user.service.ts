import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
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
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { username, isActive: true } 
    });
  }

  /**
   * 根据ID查找用户（不包含密码）
   */
  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      select: ['id', 'username', 'email', 'nickname', 'isActive', 'createdAt', 'updatedAt']
    });
    return user;
  }

  /**
   * 创建新用户
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // 检查用户名是否已存在
    const existingUser = await this.findByUsername(createUserDto.username);
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 密码加密
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // 创建用户
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    
    // 返回不包含密码的用户信息
    const { password, ...result } = savedUser;
    return result;
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
      select: ['id', 'username', 'email', 'nickname', 'isActive', 'createdAt', 'updatedAt'],
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