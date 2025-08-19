import { IsString, IsEnum, IsNotEmpty, MaxLength, IsUrl, IsOptional } from 'class-validator';

/**
 * 创建NFT的请求DTO
 */
export class CreateNftDto {
  @IsString({ message: 'NFT名称必须是字符串' })
  @IsNotEmpty({ message: 'NFT名称不能为空' })
  @MaxLength(100, { message: 'NFT名称不能超过100个字符' })
  name: string;

  @IsString({ message: 'NFT图片URL必须是字符串' })
  @IsNotEmpty({ message: 'NFT图片URL不能为空' })
  @IsUrl({}, { message: 'NFT图片URL格式不正确' })
  @MaxLength(500, { message: 'NFT图片URL不能超过500个字符' })
  image: string;

  @IsString({ message: 'NFT类型必须是字符串' })
  @IsNotEmpty({ message: 'NFT类型不能为空' })
  @MaxLength(100, { message: 'NFT类型不能超过100个字符' })
  type: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'], { 
    message: 'NFT状态只能是active或inactive' 
  })
  status?: 'active' | 'inactive';
}
