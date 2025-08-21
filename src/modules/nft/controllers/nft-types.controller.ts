import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NftTypesService } from '@/modules/nft/services/nft-types.service';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { AdminOnly } from '@/modules/auth/decorators/admin-only.decorator';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ApiResponse } from '@/common';
import { NftStatus } from '@/modules/nft/constants';

/**
 * NFT类型控制器
 * 
 * 专门处理NFT类型模板相关的HTTP请求
 * 主要用于管理员创建和管理NFT类型定义
 * 
 * 功能范围：
 * - 创建NFT类型模板（管理员权限）
 * - 查询NFT类型信息（公开访问）
 * - 管理NFT类型状态（管理员权限）
 */
@Controller('api/nft')
export class NftTypesController {
  constructor(
    private readonly nftTypesService: NftTypesService,
  ) {}

  /**
   * 创建NFT类型模板（管理员专用）
   * 
   * 创建NFT的基础类型定义，作为后续NFT实例的模板
   * 只有管理员可以创建新的NFT类型
   * 
   * @param createNftDto 创建NFT类型的数据传输对象，包含NFT的基本信息
   * @returns Promise<ApiResponse<NftResponseDto>> 创建成功的NFT类型信息
   */
  @Post()
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  async createNft(@Body() createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftTypesService.createNftType(createNftDto);
  }

  /**
   * 获取NFT类型详情（公开访问）
   * 
   * 查看指定NFT类型模板的详细信息
   * 任何用户都可以查看NFT类型详情
   * 
   * @param id NFT类型ID
   * @returns Promise<ApiResponse<NftResponseDto>> NFT类型详情信息
   */
  @Public()
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftTypesService.findNftTypeById(id);
  }

  /**
   * 获取NFT类型列表（公开访问）
   * 
   * 查看所有可用的NFT类型模板，支持状态筛选
   * 用户可以基于这些类型创建NFT实例
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
      return await this.nftTypesService.findNftTypesByStatus(status);
    }
    return await this.nftTypesService.findAllNftTypes();
  }
}
