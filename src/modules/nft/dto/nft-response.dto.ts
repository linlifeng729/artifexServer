import { Nft } from '@/modules/nft/entities/nft.entity';

/**
 * NFT响应DTO
 */
export class NftResponseDto {
  id: number;
  name: string;
  image: string;
  type: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * 从NFT实体转换为响应DTO
   */
  static fromEntity(nft: Nft): NftResponseDto {
    const response = new NftResponseDto();
    response.id = nft.id;
    response.name = nft.name;
    response.image = nft.image;
    response.type = nft.type;
    response.status = nft.status;
    return response;
  }
}
