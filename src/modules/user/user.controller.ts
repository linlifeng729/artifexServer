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
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from '@/modules/user/services/user.service';
import { UpdateUserDto } from '@/modules/user/dto';
import { USER_CONSTANTS } from '@/modules/user/constants';

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
   * @param limit 每页数量，默认为10，最大100
   */
  @Get()
  async getUserList(
    @Query('page', new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_PAGE), ParseIntPipe) 
    page: number,
    @Query('limit', new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT), ParseIntPipe) 
    limit: number,
  ) {
    return await this.userService.getUserList(page, limit);
  }

  /**
   * 根据ID获取用户信息
   * 
   * @param id 用户的UUID标识符
   */
  @Get(':id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.getUserById(id);
  }

  /**
   * 更新用户信息
   * 
   * @param id 用户的UUID标识符
   * @param updateUserDto 更新用户信息的数据传输对象
   */
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto);
  }

  /**
   * 删除用户（软删除）
   * 
   * @param id 用户的UUID标识符
   */
  @Delete(':id')
  @HttpCode(204)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.deleteUser(id);
  }
}