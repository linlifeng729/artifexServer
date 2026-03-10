import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { NftInstancesService } from '@/modules/nft/services/nft-instances.service';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { QueryNftInstancesDto } from '@/modules/nft/dto/query-nft-instances.dto';
import { Public } from '@/modules/auth/decorators';
import { ApiResponse } from '@/common/interceptors/response.interceptor';

/**
 * NFT实例控制器
 */
@Controller('api/nft-instances')
export class NftInstancesController {
  constructor(
    private readonly nftInstancesService: NftInstancesService,
  ) {}

  /** 发布NFT实例（用户鉴权） */
  @Post()
  async publishNftInstance(    
    @Body() createNftInstanceDto: CreateNftInstanceDto,
    @Request() request: any,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    const userId = request.user.userId;
    return await this.nftInstancesService.createNftInstance(createNftInstanceDto, userId);
  }

  /** 获取NFT实例列表（公开） */
  @Public()
  @Get()
  async getNftInstanceList(
    @Query() queryDto: QueryNftInstancesDto,
  ): Promise<ApiResponse<any>> {
    return await this.nftInstancesService.getNftInstanceList(queryDto);
  }

  /** 获取当前用户的NFT实例列表（用户鉴权） */
  @Get('my')
  async getMyNftInstanceList(
    @Request() request: any,
    @Query() queryDto: QueryNftInstancesDto,
  ): Promise<ApiResponse<any>> {
    const userId = request.user.userId;
    return await this.nftInstancesService.getNftInstanceListByOwner(userId, queryDto);
  }

  /** 获取NFT实例详情（公开） */
  @Public()
  @Get(':id')
  async getNftInstanceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    return await this.nftInstancesService.findNftInstanceById(id);
  }
}
