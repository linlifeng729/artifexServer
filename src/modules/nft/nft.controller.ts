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
import { NftService } from '@/modules/nft/services/nft.service';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { AdminOnly } from '@/modules/auth/decorators/admin-only.decorator';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ApiResponse } from '@/common';

/**
 * NFT控制器
 * 
 * 处理NFT相关的HTTP请求
 * 包含管理员专用的创建接口和公开的查询接口
 */
@Controller('api/nft')
export class NftController {
  constructor(
    private readonly nftService: NftService,
  ) {}

  /**
   * 创建新的NFT（仅限管理员）
   * 
   * @param createNftDto 创建NFT的数据传输对象，包含NFT的基本信息
   */
  @Post()
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  async createNft(@Body() createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftService.createNft(createNftDto);
  }

  /**
   * 获取NFT详情
   * 
   * @param id NFT ID
   */
  @Public()
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftService.findById(id);
  }

  /**
   * 获取NFT列表
   * 
   * @param status 可选的状态筛选参数，用于过滤NFT状态（active | inactive）
   */
  @Public()
  @Get()
  async findAll(
    @Query('status') status?: 'active' | 'inactive',
  ): Promise<ApiResponse<NftResponseDto[]>> {
    if (status) {
      return await this.nftService.findByStatus(status);
    }
    return await this.nftService.findAll();
  }
}
