import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NftInstancesService } from '@/modules/nft/services/nft-instances.service';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ApiResponse } from '@/common';
import { NftInstanceStatus } from '@/modules/nft/constants';

/**
 * NFT实例控制器
 * 
 * 专门处理NFT商品实例相关的HTTP请求
 * 主要用于用户发布、查看和管理NFT商品实例
 * 
 * 功能范围：
 * - 发布NFT商品实例（用户权限）
 * - 查询NFT实例信息（公开访问）
 * - 管理个人NFT实例（用户权限）
 * - 交易相关功能（用户权限）
 */
@Controller('api/nft-instances')
export class NftInstancesController {
  constructor(
    private readonly nftInstancesService: NftInstancesService,
  ) {}

  /**
   * 发布NFT在售商品实例（用户鉴权）
   * 
   * @param createNftInstanceDto 创建NFT实例的数据传输对象
   * @param request HTTP请求对象，包含已认证的用户信息
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> 创建成功的NFT实例信息
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async publishNftInstance(    
    @Body() createNftInstanceDto: CreateNftInstanceDto,
    @Request() request: any,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    const userId = request.user.userId; // 从JWT token解析出的用户信息获取数字ID
    return await this.nftInstancesService.createNftInstance(createNftInstanceDto, userId);
  }

  /**
   * 获取NFT在售商品实例列表（公开访问）
   * 
   * @param status 可选的状态筛选参数，用于过滤NFT实例状态（available | sold | reserved）
   * @param page 可选的页码参数，默认为1
   * @param limit 可选的每页条数参数，默认为10
   * @returns Promise<ApiResponse<any>> NFT实例分页列表
   */
  @Public()
  @Get()
  async getNftInstanceList(
    @Query('status') status?: NftInstanceStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponse<any>> {
    return await this.nftInstancesService.getNftInstanceList(status, page, limit);
  }

  /**
   * 获取当前用户登录在售商品实例列表（用户鉴权）
   * 
   * @param request HTTP请求对象，包含已认证的用户信息
   * @param page 可选的页码参数，默认为1
   * @param limit 可选的每页条数参数，默认为10
   * @returns Promise<ApiResponse<any>> 用户的NFT实例分页列表
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyNftInstanceList(
    @Request() request: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponse<any>> {
    const userId = request.user.userId;
    return await this.nftInstancesService.getNftInstanceListByOwner(userId, undefined, page, limit);
  }

  /**
   * 获取在售商品实例详情（公开访问）
   * 
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情信息
   */
  @Public()
  @Get(':id')
  async getNftInstanceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    return await this.nftInstancesService.findNftInstanceById(id);
  }

  /**
   * 获取某个类型下所有在售商品列表（公开访问）
   * 
   * @param nftTypeId NFT类型ID
   * @param page 可选的页码参数，默认为1
   * @param limit 可选的每页条数参数，默认为10
   * @returns Promise<ApiResponse<any>> 指定类型的NFT实例分页列表
   */
  @Public()
  @Get('by-type/:nftTypeId')
  async getNftInstanceListByType(
    @Param('nftTypeId', ParseIntPipe) nftTypeId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponse<any>> {
    return await this.nftInstancesService.getNftInstanceListByType(nftTypeId, undefined, page, limit);
  }
}
