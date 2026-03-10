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
import { AdminOnly, Public } from '@/modules/auth/decorators';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { LoggingService } from '@/common/services/logging.service';

/**
 * NFT类型控制器
 */
@Controller('api/nft')
export class NftTypesController {  
  constructor(
    private readonly nftTypesService: NftTypesService,
    private readonly loggingService: LoggingService,
  ) {}

  /** 创建NFT类型（管理员权限） */
  @Post()
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  async createNft(@Body() createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftTypesService.createNftType(createNftDto);
  }

  /** 获取NFT类型列表（公开） */
  @Public()
  @Get()
  async getNftTypeList(
    @Query() queryDto: QueryNftTypesDto,
  ): Promise<ApiResponse<{ 
    list: NftResponseDto[], 
    total: number, 
    page: number, 
    limit: number,
    totalPages: number
  }>> {
    return await this.nftTypesService.getNftTypeList(queryDto);
  }

  /** 获取NFT类型详情（公开） */
  @Public()
  @Get(':id')
  async getNftTypeById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftResponseDto>> {
    return await this.nftTypesService.findNftTypeById(id);
  }
}
