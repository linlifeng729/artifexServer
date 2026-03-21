import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import {
  NftStatus,
  NFT_STATUS_VALUES,
  PAGINATION_CONSTRAINTS,
  NftSortOption,
  NFT_SORT_OPTIONS_VALUES,
} from '@/modules/nft/constants';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * NFT类型查询DTO
 * 用于封装NFT类型列表查询的所有参数
 */
export class QueryNftTypesDto {
  @ApiPropertyOptional({ description: 'NFT状态', enum: NFT_STATUS_VALUES })
  @IsOptional()
  @IsEnum(NFT_STATUS_VALUES, {
    message: `状态只能是${NFT_STATUS_VALUES.join('或')}`,
  })
  status?: NftStatus;

  @ApiPropertyOptional({ description: 'NFT名称模糊搜索' })
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: '排序方式',
    enum: NFT_SORT_OPTIONS_VALUES,
    default: 'latest',
  })
  @IsOptional()
  @IsEnum(NFT_SORT_OPTIONS_VALUES, {
    message: `排序方式只能是${NFT_SORT_OPTIONS_VALUES.join('或')}`,
  })
  sort?: NftSortOption = 'latest';

  @ApiPropertyOptional({
    description: '页码',
    default: PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? parseInt(value, 10) : PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
  )
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码最小值为1' })
  page: number = PAGINATION_CONSTRAINTS.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: '每页条数',
    default: PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value ? parseInt(value, 10) : PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
  )
  @IsInt({ message: '每页条数必须是整数' })
  @Min(1, { message: '每页条数最小值为1' })
  @Max(PAGINATION_CONSTRAINTS.MAX_LIMIT, {
    message: `每页条数最大值为${PAGINATION_CONSTRAINTS.MAX_LIMIT}`,
  })
  limit: number = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT;
}
