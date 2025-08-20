import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
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
    @InjectRepository(NftInstance)
    private readonly nftInstanceRepository: Repository<NftInstance>,
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

  /**
   * 创建NFT实例（发布商品）
   * @param createNftInstanceDto 创建NFT实例的数据
   * @param userId 当前登录用户的数字ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> 创建成功的NFT实例信息
   * @throws NotFoundException 当NFT类型不存在或已下架时
   * @throws ConflictException 当业务规则冲突时
   */
  async createNftInstance(
    createNftInstanceDto: CreateNftInstanceDto, 
    userId: number
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    // 检查NFT类型是否存在且状态为active
    const nft = await this.nftRepository.findOne({
      where: { id: createNftInstanceDto.nftId, status: 'active' },
    });

    if (!nft) {
      throw new NotFoundException('NFT类型不存在或已下架');
    }

    // 创建新的NFT实例
    const nftInstance = this.nftInstanceRepository.create({
      nftId: createNftInstanceDto.nftId,
      ownerId: userId,
      price: createNftInstanceDto.price,
      status: createNftInstanceDto.status || 'available',
    });

    // 保存到数据库
    const savedNftInstance = await this.nftInstanceRepository.save(nftInstance);

    // 查询完整的NFT实例信息（包含关联数据）
    const nftInstanceWithRelations = await this.nftInstanceRepository.findOne({
      where: { id: savedNftInstance.id },
      relations: ['nft', 'owner'],
    });

    if (!nftInstanceWithRelations) {
      throw new NotFoundException('NFT实例创建后查询失败');
    }

    // 返回响应DTO
    const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstanceWithRelations);
    return ResponseHelper.success(nftInstanceResponse, 'NFT商品发布成功');
  }

  /**
   * 获取NFT实例列表
   * @param status 可选的状态筛选参数
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> NFT实例列表
   */
  async findAllNftInstances(
    status?: 'available' | 'sold' | 'reserved'
  ): Promise<ApiResponse<NftInstanceResponseDto[]>> {
    try {
      const whereCondition = status ? { status } : {};
      
      const nftInstances = await this.nftInstanceRepository.find({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: { createdAt: 'DESC' },
      });

      const nftInstanceResponses = nftInstances.map(instance => 
        NftInstanceResponseDto.fromEntity(instance)
      );
      
      const message = status 
        ? `状态为${status}的NFT商品列表查询成功` 
        : 'NFT商品列表查询成功';
      
      return ResponseHelper.success(nftInstanceResponses, message);
    } catch (error) {
      throw new Error('NFT商品列表查询失败，请稍后重试');
    }
  }

  /**
   * 根据ID获取NFT实例详情
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情
   * @throws NotFoundException 当NFT实例不存在时
   */
  async findNftInstanceById(id: number): Promise<ApiResponse<NftInstanceResponseDto>> {
    const nftInstance = await this.nftInstanceRepository.findOne({
      where: { id },
      relations: ['nft', 'owner'],
    });

    if (!nftInstance) {
      throw new NotFoundException('NFT商品不存在');
    }

    const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstance);
    return ResponseHelper.success(nftInstanceResponse, 'NFT商品详情查询成功');
  }
}
