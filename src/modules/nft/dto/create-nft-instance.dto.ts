import { IsInt, IsEnum, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { 
  NFT_INSTANCE_STATUS_VALUES, 
  NFT_CONSTRAINTS, 
  NFT_ERROR_MESSAGES,
  NftInstanceStatus 
} from '@/modules/nft/constants';

/**
 * 创建NFT实例的请求DTO
 * 用于用户发布NFT商品
 */
export class CreateNftInstanceDto {
  @IsInt({ message: NFT_ERROR_MESSAGES.VALIDATION.NFT_ID_INTEGER })
  @IsNotEmpty({ message: NFT_ERROR_MESSAGES.VALIDATION.NFT_ID_REQUIRED })
  nftId: number;

  @IsInt({ message: NFT_ERROR_MESSAGES.VALIDATION.PRICE_INTEGER })
  @IsNotEmpty({ message: NFT_ERROR_MESSAGES.VALIDATION.PRICE_REQUIRED })
  @Min(NFT_CONSTRAINTS.MIN_PRICE, { message: NFT_ERROR_MESSAGES.VALIDATION.PRICE_MIN })
  price: number;

  @IsOptional()
  @IsEnum(NFT_INSTANCE_STATUS_VALUES, { 
    message: NFT_ERROR_MESSAGES.VALIDATION.NFT_INSTANCE_STATUS_INVALID 
  })
  status?: NftInstanceStatus;
}
