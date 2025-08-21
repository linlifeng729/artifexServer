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
import { NftService } from '@/modules/nft/services/nft.service';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { AdminOnly } from '@/modules/auth/decorators/admin-only.decorator';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ApiResponse } from '@/common';
import { NftStatus, NftInstanceStatus } from '@/modules/nft/constants';

/**
 * NFT控制器
 * 
 * 处理NFT相关的HTTP请求，分为两个层级：
 * 1. NFT类型管理：管理NFT模板/类型定义（管理员权限）
 * 2. NFT实例管理：管理具体的NFT商品/实例（用户权限）
 */
@Controller('api/nft')
export class NftController {
  constructor(
    private readonly nftService: NftService,
  ) {}

  /**
   * 创建NFT类型模板（管理员专用）
   * 
   * 创建NFT的基础类型定义，作为后续NFT实例的模板
   * 
   * @param createNftDto 创建NFT类型的数据传输对象，包含NFT的基本信息
   * @returns Promise<ApiResponse<NftResponseDto>> 创建成功的NFT类型信息
   */
  @Post()
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  async createNft(@Body() createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftService.createNft(createNftDto);
  }

  /**
   * 获取NFT类型详情
   * 
   * 查看指定NFT类型模板的详细信息
   * 
   * @param id NFT类型ID
   * @returns Promise<ApiResponse<NftResponseDto>> NFT类型详情信息
   */
  @Public()
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftService.findById(id);
  }

  /**
   * 获取NFT类型列表
   * 
   * 查看所有可用的NFT类型模板，支持状态筛选
   * 
   * @param status 可选的状态筛选参数，用于过滤NFT类型状态（active | inactive）
   * @returns Promise<ApiResponse<NftResponseDto[]>> NFT类型列表
   */
  @Public()
  @Get()
  async findAll(
    @Query('status') status?: NftStatus,
  ): Promise<ApiResponse<NftResponseDto[]>> {
    if (status) {
      return await this.nftService.findByStatus(status);
    }
    return await this.nftService.findAll();
  }

  /**
   * 发布NFT在售商品实例（用户鉴权）
   * 
   * 基于现有的NFT类型模板创建具体的NFT商品实例
   * 用户可以设置价格、数量等商品属性
   * 
   * @param createNftInstanceDto 创建NFT实例的数据传输对象
   * @param request HTTP请求对象，包含已认证的用户信息
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> 创建成功的NFT实例信息
   */
  @Post('instances')
  @UseGuards(JwtAuthGuard)
  async publishNftInstance(    
    @Body() createNftInstanceDto: CreateNftInstanceDto,
    @Request() request: any,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    const userId = request.user.userId; // 从JWT token解析出的用户信息获取数字ID
    return await this.nftService.createNftInstance(createNftInstanceDto, userId);
  }

  /**
   * 获取NFT在售商品实例列表
   * 
   * 查看所有已发布的NFT商品实例，支持状态筛选
   * 包含价格、库存、所有者等商品信息
   * 
   * @param status 可选的状态筛选参数，用于过滤NFT实例状态（available | sold | reserved）
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> NFT实例列表
   */
  @Public()
  @Get('instances')
  async findAllNftInstances(
    @Query('status') status?: NftInstanceStatus,
  ): Promise<ApiResponse<NftInstanceResponseDto[]>> {
    return await this.nftService.findAllNftInstances(status);
  }

  /**
   * 获取NFT在售商品实例详情
   * 
   * 查看指定NFT商品实例的详细信息
   * 包含商品属性、价格、库存、交易历史等
   * 
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情信息
   */
  @Public()
  @Get('instances/:id')
  async findNftInstanceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    return await this.nftService.findNftInstanceById(id);
  }
}
