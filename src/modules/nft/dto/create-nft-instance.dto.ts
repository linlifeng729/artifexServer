import {
  IsInt,
  IsEnum,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  NFT_INSTANCE_STATUS_VALUES,
  NFT_CONSTRAINTS,
  NftInstanceStatus,
} from '@/modules/nft/constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建NFT实例的请求DTO
 * 用于用户发布NFT商品
 */
export class CreateNftInstanceDto {
  @ApiProperty({ description: 'NFT类型ID' })
  @IsInt({ message: 'NFT类型ID必须是整数' })
  @IsNotEmpty({ message: 'NFT类型ID不能为空' })
  nftId: number;

  @ApiPropertyOptional({ description: 'NFT编号', maxLength: 50 })
  @IsOptional()
  @IsString({ message: 'NFT编号必须是字符串' })
  @MaxLength(50, { message: 'NFT编号长度不能超过50个字符' })
  nftNumber?: string;

  @ApiProperty({
    description: '价格（单位：分）',
    minimum: NFT_CONSTRAINTS.MIN_PRICE,
  })
  @IsInt({ message: '价格必须是整数' })
  @IsNotEmpty({ message: '价格不能为空' })
  @Min(NFT_CONSTRAINTS.MIN_PRICE, {
    message: `价格必须大于${NFT_CONSTRAINTS.MIN_PRICE - 1}`,
  })
  price: number;

  @ApiPropertyOptional({
    description: 'NFT实例状态',
    enum: NFT_INSTANCE_STATUS_VALUES,
  })
  @IsOptional()
  @IsEnum(NFT_INSTANCE_STATUS_VALUES, {
    message: `NFT实例状态只能是${NFT_INSTANCE_STATUS_VALUES.join('、')}`,
  })
  status?: NftInstanceStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  remark?: string;
}
