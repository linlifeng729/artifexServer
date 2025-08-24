import { Transform } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { NftStatus, NFT_STATUS_VALUES, PAGINATION_CONSTRAINTS } from '@/modules/nft/constants';

/**
 * NFT类型查询DTO
 * 用于封装NFT类型列表查询的所有参数
 */
export class QueryNftTypesDto {
  /**
   * NFT状态过滤
   */
  @IsOptional()
  @IsEnum(NFT_STATUS_VALUES, { 
    message: `状态只能是${NFT_STATUS_VALUES.join('或')}` 
  })
  status?: NftStatus;

  /**
   * NFT名称模糊搜索
   */
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  name?: string;

  /**
   * NFT类型过滤
   */
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  type?: string;

  /**
   * 页码
   * Query参数为字符串，需要转换为数字
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return PAGINATION_CONSTRAINTS.DEFAULT_PAGE;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? value : num; // 如果转换失败，返回原值让验证器处理
  })
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
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return PAGINATION_CONSTRAINTS.DEFAULT_LIMIT;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? value : num; // 如果转换失败，返回原值让验证器处理
  })
  @IsInt({ message: '每页条数必须是整数' })
  @Min(PAGINATION_CONSTRAINTS.MIN_LIMIT, { 
    message: `每页条数最小值为${PAGINATION_CONSTRAINTS.MIN_LIMIT}` 
  })
  @Max(PAGINATION_CONSTRAINTS.MAX_LIMIT, { 
    message: `每页条数最大值为${PAGINATION_CONSTRAINTS.MAX_LIMIT}` 
  })
  limit: number = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT;
}
