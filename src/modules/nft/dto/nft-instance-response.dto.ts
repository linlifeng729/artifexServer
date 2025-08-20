import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';

/**
 * NFT实例响应DTO
 * 用于返回NFT实例信息
 */
export class NftInstanceResponseDto {
  id: number;
  nftId: number;
  ownerId: number;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  createdAt: Date;
  updatedAt: Date;
  
  // NFT类型信息（如果包含关联查询）
  nft?: {
    id: number;
    name: string;
    image: string;
    type: string;
    status: 'active' | 'inactive';
  };
  
  // 拥有者信息（如果包含关联查询）
  owner?: {
    numericId: number;
    id: string;
    nickname?: string;
  };

  constructor() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  /**
   * 从NFT实例实体转换为响应DTO
   * @param nftInstance NFT实例实体
   * @returns NFT实例响应DTO
   */
  static fromEntity(nftInstance: NftInstance): NftInstanceResponseDto {
    const response = new NftInstanceResponseDto();
    response.id = nftInstance.id;
    response.nftId = nftInstance.nftId;
    response.ownerId = nftInstance.ownerId;
    response.price = nftInstance.price;
    response.status = nftInstance.status;
    response.createdAt = nftInstance.createdAt;
    response.updatedAt = nftInstance.updatedAt;

    // 如果包含NFT关联信息
    if (nftInstance.nft) {
      response.nft = {
        id: nftInstance.nft.id,
        name: nftInstance.nft.name,
        image: nftInstance.nft.image,
        type: nftInstance.nft.type,
        status: nftInstance.nft.status,
      };
    }

    // 如果包含拥有者关联信息
    if (nftInstance.owner) {
      response.owner = {
        numericId: nftInstance.owner.numericId,
        id: nftInstance.owner.id,
        nickname: nftInstance.owner.nickname,
      };
    }

    return response;
  }
}
