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

  /**
   * 从NFT实体转换为响应DTO
   * @param nft NFT实体
   * @returns NFT响应DTO
   */
  static fromEntity(nft: Nft): NftResponseDto {
    const response = new NftResponseDto();
    response.id = nft.id;
    response.name = nft.name;
    response.image = nft.image;
    response.type = nft.type;
    response.status = nft.status;
    response.createdAt = nft.createdAt;
    response.updatedAt = nft.updatedAt;
    return response;
  }
}
