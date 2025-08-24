import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Logger,
  Inject,
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
    @Inject(Logger)
    private readonly logger: Logger,
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
   * @param status 可选的状态筛选参数，用于过滤NFT类型状态（active | inactive）
   * @param page 可选的页码参数，默认为1
   * @param limit 可选的每页条数参数，默认为10
   * @returns Promise<ApiResponse<any>> NFT类型分页列表
   */
  @Public()
  @Get()
  async findAll(
    @Query('status') status?: NftStatus,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponse<any>> {
    this.logger.log(`Query parameters - status: ${status}, page: ${page}, limit: ${limit}`);
    
    if (status) {
      this.logger.log(`Filtering NFT types by status: ${status}`);
      return await this.nftTypesService.findNftTypesByStatus(status, page, limit);
    }
    
    this.logger.log('No status filter applied, fetching all NFT types');
    return await this.nftTypesService.findAllNftTypes(page, limit);
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
