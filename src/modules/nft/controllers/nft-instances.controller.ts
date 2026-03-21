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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

/**
 * NFT实例控制器
 */
@ApiTags('NFT实例')
@Controller('api/nft-instances')
export class NftInstancesController {
  constructor(private readonly nftInstancesService: NftInstancesService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '发布NFT实例' })
  @SwaggerApiResponse({ status: 201, description: '发布成功' })
  @Post()
  async publishNftInstance(
    @Body() createNftInstanceDto: CreateNftInstanceDto,
    @Request() request: any,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    const userId = request.user.userId;
    return await this.nftInstancesService.createNftInstance(
      createNftInstanceDto,
      userId,
    );
  }

  @Public()
  @ApiOperation({ summary: '获取NFT实例列表' })
  @Get()
  async getNftInstanceList(@Query() queryDto: QueryNftInstancesDto): Promise<
    ApiResponse<{
      list: NftInstanceResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    return await this.nftInstancesService.getNftInstanceList(queryDto);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取当前用户的NFT实例列表' })
  @Get('my')
  async getMyNftInstanceList(
    @Request() request: any,
    @Query() queryDto: QueryNftInstancesDto,
  ): Promise<
    ApiResponse<{
      list: NftInstanceResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    const userId = request.user.userId;
    return await this.nftInstancesService.getNftInstanceListByOwner(
      userId,
      queryDto,
    );
  }

  @Public()
  @ApiOperation({ summary: '获取NFT实例详情' })
  @Get(':id')
  async getNftInstanceById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    return await this.nftInstancesService.findNftInstanceById(id);
  }
}
