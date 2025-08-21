import { IsString, IsEnum, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';
import { 
  NFT_STATUS_VALUES, 
  NFT_CONSTRAINTS, 
  NFT_ERROR_MESSAGES,
  NftStatus 
} from '@/modules/nft/constants';

/**
 * 创建NFT的请求DTO
 */
export class CreateNftDto {
  @IsString({ message: NFT_ERROR_MESSAGES.VALIDATION.NAME_STRING })
  @IsNotEmpty({ message: NFT_ERROR_MESSAGES.VALIDATION.NAME_REQUIRED })
  @MaxLength(NFT_CONSTRAINTS.NAME_MAX_LENGTH, { 
    message: NFT_ERROR_MESSAGES.VALIDATION.NAME_MAX_LENGTH 
  })
  name: string;

  @IsString({ message: NFT_ERROR_MESSAGES.VALIDATION.IMAGE_STRING })
  @IsNotEmpty({ message: NFT_ERROR_MESSAGES.VALIDATION.IMAGE_REQUIRED })
  @IsUrl({}, { message: NFT_ERROR_MESSAGES.VALIDATION.IMAGE_URL_FORMAT })
  @MaxLength(NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH, { 
    message: NFT_ERROR_MESSAGES.VALIDATION.IMAGE_MAX_LENGTH 
  })
  image: string;

  @IsString({ message: NFT_ERROR_MESSAGES.VALIDATION.TYPE_STRING })
  @IsNotEmpty({ message: NFT_ERROR_MESSAGES.VALIDATION.TYPE_REQUIRED })
  @MaxLength(NFT_CONSTRAINTS.TYPE_MAX_LENGTH, { 
    message: NFT_ERROR_MESSAGES.VALIDATION.TYPE_MAX_LENGTH 
  })
  type: string;

  @IsOptional()
  @IsEnum(NFT_STATUS_VALUES, { 
    message: NFT_ERROR_MESSAGES.VALIDATION.NFT_STATUS_INVALID 
  })
  status?: NftStatus;
}
