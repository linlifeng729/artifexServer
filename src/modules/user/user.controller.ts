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
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import {
  PublicUser,
  UserPaginatedResult,
  UserDeleteResult,
} from '@/modules/user/types/user.types';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

/**
 * 用户控制器
 * 处理用户管理相关的HTTP请求
 */
@ApiTags('用户管理')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户列表（分页）' })
  @ApiQuery({
    name: 'page',
    description: '页码',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: '每页数量',
    required: false,
    type: Number,
  })
  @Get()
  async getUserList(
    @Query(
      'page',
      new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_PAGE),
      ParseIntPipe,
    )
    page: number,
    @Query(
      'limit',
      new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT),
      ParseIntPipe,
    )
    limit: number,
  ): Promise<ApiResponse<UserPaginatedResult>> {
    return await this.userService.getUserList(page, limit);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '根据ID获取用户信息' })
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<PublicUser | null>> {
    return await this.userService.getUserById(id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户信息' })
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<PublicUser | null>> {
    return await this.userService.updateUser(id, updateUserDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户（软删除）' })
  @Delete(':id')
  @HttpCode(204)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<UserDeleteResult>> {
    return await this.userService.deleteUser(id);
  }
}
