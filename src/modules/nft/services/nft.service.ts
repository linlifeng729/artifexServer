import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { ResponseHelper, ApiResponse } from '@/common';

/**
 * NFT服务类
 * 处理NFT相关的业务逻辑
 */
@Injectable()
export class NftService {
  constructor(
    @InjectRepository(Nft)
    private readonly nftRepository: Repository<Nft>,
  ) {}

  /**
   * 创建新的NFT
   * @param createNftDto 创建NFT的数据
   * @returns Promise<ApiResponse<NftResponseDto>> 创建成功的NFT信息
   * @throws ConflictException 当NFT名称已存在时
   */
  async createNft(createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
    // 检查NFT名称是否已存在
    const existingNft = await this.nftRepository.findOne({
      where: { name: createNftDto.name },
    });

    if (existingNft) {
      throw new ConflictException('NFT名称已存在');
    }

    // 创建新的NFT实体
    const nft = this.nftRepository.create({
      name: createNftDto.name,
      image: createNftDto.image,
      type: createNftDto.type,
      status: createNftDto.status || 'active',
    });

    // 保存到数据库
    const savedNft = await this.nftRepository.save(nft);

    // 返回响应DTO
    const nftResponse = NftResponseDto.fromEntity(savedNft);
    return ResponseHelper.success(nftResponse, 'NFT创建成功');
  }

  /**
   * 根据ID获取NFT信息
   * @param id NFT ID
   * @returns Promise<ApiResponse<NftResponseDto>> NFT信息
   * @throws NotFoundException 当NFT不存在时
   */
  async findById(id: number): Promise<ApiResponse<NftResponseDto>> {
    const nft = await this.nftRepository.findOne({ where: { id } });
    
    if (!nft) {
      throw new NotFoundException('NFT不存在');
    }

    const nftResponse = NftResponseDto.fromEntity(nft);
    return ResponseHelper.success(nftResponse, 'NFT查询成功');
  }

  /**
   * 获取所有NFT列表
   * @returns Promise<ApiResponse<NftResponseDto[]>> NFT列表
   */
  async findAll(): Promise<ApiResponse<NftResponseDto[]>> {
    try {
      const nfts = await this.nftRepository.find({
        order: { createdAt: 'DESC' },
      });

      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));
      return ResponseHelper.success(nftResponses, 'NFT列表查询成功');
    } catch (error) {
      throw new Error('NFT列表查询失败，请稍后重试');
    }
  }

  /**
   * 根据状态获取NFT列表
   * @param status NFT状态
   * @returns Promise<ApiResponse<NftResponseDto[]>> NFT列表
   */
  async findByStatus(status: 'active' | 'inactive'): Promise<ApiResponse<NftResponseDto[]>> {
    try {
      const nfts = await this.nftRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });

      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));
      return ResponseHelper.success(nftResponses, `状态为${status}的NFT列表查询成功`);
    } catch (error) {
      throw new Error('NFT查询失败，请稍后重试');
    }
  }
}
