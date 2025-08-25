import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftStatus } from '@/modules/nft/constants';

/**
 * NFT响应DTO
 */
export class NftResponseDto {
  id: number;
  name: string;
  image: string;
  type: string;
  status: NftStatus;
  createdAt: Date;
  updatedAt: Date;
  availableCount?: number;
  minPrice?: number;

  /**
   * 从NFT实体转换为响应DTO
   * @param nft NFT实体
   * @param availableCount 可售数量
   * @param minPrice 最低价格（分）
   * @returns NFT响应DTO
   */
  static fromEntity(
    nft: Nft, 
    availableCount?: number, 
    minPrice?: number
  ): NftResponseDto {
    const response = new NftResponseDto();
    
    // 复制基本属性
    response.id = nft.id;
    response.name = nft.name;
    response.image = nft.image;
    response.type = nft.type;
    response.status = nft.status;
    response.createdAt = nft.createdAt;
    response.updatedAt = nft.updatedAt;
    
    // 设置统计信息
    response.availableCount = availableCount ?? 0;
    response.minPrice = minPrice ?? 0;
    
    return response;
  }

  /**
   * 从原始查询结果创建DTO
   * @param rawNft 原始查询结果
   * @returns NFT响应DTO
   */
  static fromRawResult(rawNft: any): NftResponseDto {
    const response = new NftResponseDto();
    
    // 从原始结果中提取数据
    response.id = rawNft.nft_id;
    response.name = rawNft.nft_name;
    response.image = rawNft.nft_image;
    response.type = rawNft.nft_type;
    response.status = rawNft.nft_status;
    response.createdAt = rawNft.nft_createdAt;
    response.updatedAt = rawNft.nft_updatedAt;
    
    // 设置统计信息
    response.availableCount = parseInt(rawNft.availableCount) || 0;
    response.minPrice = rawNft.minPrice ? parseFloat(rawNft.minPrice) : 0;
    
    return response;
  }
}
