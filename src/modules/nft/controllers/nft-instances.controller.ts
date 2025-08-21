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
   * 基于现有的NFT类型模板创建具体的NFT商品实例
   * 用户可以设置价格、数量等商品属性
   * 只有已登录的用户才能发布NFT实例
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
   * 查看所有已发布的NFT商品实例，支持状态筛选
   * 包含价格、库存、所有者等商品信息
   * 任何用户都可以浏览NFT市场
   * 
   * @param status 可选的状态筛选参数，用于过滤NFT实例状态（available | sold | reserved）
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> NFT实例列表
   */
  @Public()
  @Get()
  async findAllNftInstances(
    @Query('status') status?: NftInstanceStatus,
  ): Promise<ApiResponse<NftInstanceResponseDto[]>> {
    return await this.nftInstancesService.findAllNftInstances(status);
  }

  /**
   * 获取NFT在售商品实例详情（公开访问）
   * 
   * 查看指定NFT商品实例的详细信息
   * 包含商品属性、价格、库存、交易历史等
   * 任何用户都可以查看NFT详情
   * 
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情信息
   */
  @Public()
  @Get(':id')
  async findNftInstanceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    return await this.nftInstancesService.findNftInstanceById(id);
  }

  /**
   * 获取当前用户的NFT实例列表（用户鉴权）
   * 
   * 查看当前登录用户发布的所有NFT实例
   * 用户可以管理自己的NFT商品
   * 
   * @param request HTTP请求对象，包含已认证的用户信息
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> 用户的NFT实例列表
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyNftInstances(
    @Request() request: any,
  ): Promise<ApiResponse<NftInstanceResponseDto[]>> {
    const userId = request.user.userId;
    return await this.nftInstancesService.findNftInstancesByOwner(userId);
  }

  /**
   * 根据NFT类型获取实例列表（公开访问）
   * 
   * 查看特定NFT类型下的所有实例
   * 用户可以浏览某个类型的所有可用商品
   * 
   * @param nftTypeId NFT类型ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> 指定类型的NFT实例列表
   */
  @Public()
  @Get('by-type/:nftTypeId')
  async findNftInstancesByType(
    @Param('nftTypeId', ParseIntPipe) nftTypeId: number,
  ): Promise<ApiResponse<NftInstanceResponseDto[]>> {
    return await this.nftInstancesService.findNftInstancesByType(nftTypeId);
  }
}
