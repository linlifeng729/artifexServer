import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { NftInstanceStatus, NFT_INSTANCE_STATUS_VALUES, PAGINATION_CONSTRAINTS, NftSortOption, NFT_SORT_OPTIONS_VALUES } from '@/modules/nft/constants';

/**
 * NFT实例查询DTO
 * 用于封装NFT实例列表查询的所有参数
 */
export class QueryNftInstancesDto {
  /**
   * NFT实例状态过滤
   */
  @IsOptional()
  @IsEnum(NFT_INSTANCE_STATUS_VALUES, { 
    message: `状态只能是${NFT_INSTANCE_STATUS_VALUES.join('或')}` 
  })
  status?: NftInstanceStatus;

  /**
   * 排序方式
   * latest: 最新发布（默认）
   * price_low_to_high: 最低价格
   * price_high_to_low: 最高价格
   */
  @IsOptional()
  @IsEnum(NFT_SORT_OPTIONS_VALUES, { 
    message: `排序方式只能是${NFT_SORT_OPTIONS_VALUES.join('或')}` 
  })
  sort?: NftSortOption = 'latest';

  /**
   * 页码
   * Query参数为字符串，需要转换为数字
   */
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : PAGINATION_CONSTRAINTS.DEFAULT_PAGE)
  @IsInt({ message: '页码必须是整数' })
  @Min(PAGINATION_CONSTRAINTS.MIN_PAGE, { 
    message: `页码最小值为${PAGINATION_CONSTRAINTS.MIN_PAGE}` 
  })
  page: number = PAGINATION_CONSTRAINTS.DEFAULT_PAGE;

  /**
   * 每页条数
   * Query参数为字符串，需要转换为数字
   */
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : PAGINATION_CONSTRAINTS.DEFAULT_LIMIT)
  @IsInt({ message: '每页条数必须是整数' })
  @Min(PAGINATION_CONSTRAINTS.MIN_LIMIT, { 
    message: `每页条数最小值为${PAGINATION_CONSTRAINTS.MIN_LIMIT}` 
  })
  @Max(PAGINATION_CONSTRAINTS.MAX_LIMIT, { 
    message: `每页条数最大值为${PAGINATION_CONSTRAINTS.MAX_LIMIT}` 
  })
  limit: number = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT;
}
