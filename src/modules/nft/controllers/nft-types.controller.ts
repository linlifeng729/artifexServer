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
import { CreateNftDto, NftResponseDto, QueryNftTypesDto } from '@/modules/nft/dto';
import { AdminOnly } from '@/modules/auth/decorators/admin-only.decorator';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ApiResponse } from '@/common';
import { LoggingService } from '@/common/services/logging.service';

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
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * 创建NFT类型模板（管理员权限）
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
   * 获取NFT类型列表（公开访问）
   * 
   * 支持多种查询条件：
   * - status: NFT状态过滤（active | inactive）
   * - name: NFT名称模糊搜索
   * - type: NFT类型过滤
   * - page: 页码（默认为1）
   * - limit: 每页条数（默认为10，最大100）
   * 
   * @param queryDto 查询条件DTO，自动验证和转换查询参数
   * @returns Promise<ApiResponse<{list: NftResponseDto[], total: number, page: number, limit: number, totalPages: number}>> NFT类型分页列表
   */
  @Public()
  @Get()
  async findAll(
    @Query() queryDto: QueryNftTypesDto,
  ): Promise<ApiResponse<{ 
    list: NftResponseDto[], 
    total: number, 
    page: number, 
    limit: number,
    totalPages: number
  }>> {
    return await this.nftTypesService.queryNftTypes(queryDto);
  }

  /**
   * 获取NFT类型详情（公开访问）
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
}
