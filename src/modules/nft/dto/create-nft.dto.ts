import { IsString, IsEnum, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';
import { 
  NFT_STATUS_VALUES, 
  NFT_CONSTRAINTS,
  NftStatus 
} from '@/modules/nft/constants';

/**
 * 创建NFT的请求DTO
 */
export class CreateNftDto {
  @IsString({ message: 'NFT名称必须是字符串' })
  @IsNotEmpty({ message: 'NFT名称不能为空' })
  @MaxLength(NFT_CONSTRAINTS.NAME_MAX_LENGTH, { 
    message: `NFT名称不能超过${NFT_CONSTRAINTS.NAME_MAX_LENGTH}个字符` 
  })
  name: string;

  @IsString({ message: 'NFT图片URL必须是字符串' })
  @IsNotEmpty({ message: 'NFT图片URL不能为空' })
  @IsUrl({}, { message: 'NFT图片URL格式不正确' })
  @MaxLength(NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH, { 
    message: `NFT图片URL不能超过${NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH}个字符` 
  })
  image: string;

  @IsString({ message: 'NFT类型必须是字符串' })
  @IsNotEmpty({ message: 'NFT类型不能为空' })
  @MaxLength(NFT_CONSTRAINTS.TYPE_MAX_LENGTH, { 
    message: `NFT类型不能超过${NFT_CONSTRAINTS.TYPE_MAX_LENGTH}个字符` 
  })
  type: string;

  @IsOptional()
  @IsEnum(NFT_STATUS_VALUES, { 
    message: `NFT状态只能是${NFT_STATUS_VALUES.join('或')}` 
  })
  status?: NftStatus;
}
