import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  HttpCode, 
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto';

/**
 * 用户控制器
 * 处理用户管理相关的HTTP请求
 */
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取所有用户（分页）
   */
  @Get()
  @HttpCode(200)
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    const result = await this.userService.findAll(page, limit);
    return {
      success: true,
      message: '获取用户列表成功',
      data: result,
    };
  }

  /**
   * 根据ID获取用户信息
   */
  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findById(id);
    return {
      success: true,
      message: '获取用户信息成功',
      data: { user },
    };
  }

  /**
   * 创建新用户
   */
  @Post()
  @HttpCode(201)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    return {
      success: true,
      message: '创建用户成功',
      data: { user },
    };
  }

  /**
   * 更新用户信息
   */
  @Put(':id')
  @HttpCode(200)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.userService.update(id, updateUserDto);
    return {
      success: true,
      message: '更新用户信息成功',
      data: { user },
    };
  }

  /**
   * 删除用户（软删除）
   */
  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseIntPipe) id: number) {
    const success = await this.userService.softDelete(id);
    return {
      success,
      message: success ? '删除用户成功' : '删除用户失败',
      data: null,
    };
  }
}