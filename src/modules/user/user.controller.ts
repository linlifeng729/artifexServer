import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  ParseIntPipe, 
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { UserService } from '@/modules/user/services/user.service';
import { UpdateUserDto } from '@/modules/user/dto';

/**
 * 用户控制器
 * 处理用户管理相关的HTTP请求
 */
@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  /**
   * 获取所有用户（分页）
   * 
   * @param page 页码，默认为1
   * @param limit 每页数量，默认为10
   */
  @Get()
  async findAll(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return await this.userService.findAll(page, limit);
  }

  /**
   * 根据ID获取用户信息
   * 
   * @param id 用户的UUID标识符
   */
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.findById(id);
  }

  /**
   * 更新用户信息
   * 
   * @param id 用户的UUID标识符
   * @param updateUserDto 更新用户信息的数据传输对象
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  /**
   * 删除用户（软删除）
   * 
   * @param id 用户的UUID标识符
   */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.softDelete(id);
  }
}