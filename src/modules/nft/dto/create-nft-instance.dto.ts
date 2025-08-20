import { IsInt, IsEnum, IsNotEmpty, Min, IsOptional } from 'class-validator';

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
  @Min(1, { message: '价格必须大于0' })
  price: number;

  @IsOptional()
  @IsEnum(['available', 'sold', 'reserved'], { 
    message: 'NFT实例状态只能是available、sold或reserved' 
  })
  status?: 'available' | 'sold' | 'reserved';
}
