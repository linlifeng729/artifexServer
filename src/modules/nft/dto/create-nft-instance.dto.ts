import { IsInt, IsEnum, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { 
  NFT_INSTANCE_STATUS_VALUES, 
  NFT_CONSTRAINTS,
  NftInstanceStatus 
} from '@/modules/nft/constants';

/**
 * 创建NFT实例的请求DTO
 * 用于用户发布NFT商品
 */
export class CreateNftInstanceDto {
  @IsInt({ message: 'NFT类型ID必须是整数' })
  @IsNotEmpty({ message: 'NFT类型ID不能为空' })
  nftId: number;

  @IsInt({ message: '价格必须是整数' })
  @IsNotEmpty({ message: '价格不能为空' })
  @Min(NFT_CONSTRAINTS.MIN_PRICE, { message: `价格必须大于${NFT_CONSTRAINTS.MIN_PRICE - 1}` })
  price: number;

  @IsOptional()
  @IsEnum(NFT_INSTANCE_STATUS_VALUES, { 
    message: `NFT实例状态只能是${NFT_INSTANCE_STATUS_VALUES.join('、')}` 
  })
  status?: NftInstanceStatus;
}
