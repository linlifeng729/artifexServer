import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { ResponseHelper, ApiResponse } from '@/common';
import { 
  NFT_STATUS, 
  NFT_INSTANCE_STATUS, 
  NFT_ERROR_MESSAGES, 
  NFT_SUCCESS_MESSAGES,
  NftStatus,
  NftInstanceStatus 
} from '@/modules/nft/constants';

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
    try {
      // 检查NFT名称是否已存在
      const existingNft = await this.nftRepository.findOne({
        where: { name: createNftDto.name },
      });

      if (existingNft) {
        throw new ConflictException(NFT_ERROR_MESSAGES.NFT_NAME_EXISTS);
      }

      // 创建新的NFT实体
      const nft = this.nftRepository.create({
        name: createNftDto.name,
        image: createNftDto.image,
        type: createNftDto.type,
        status: createNftDto.status || NFT_STATUS.ACTIVE,
      });

      // 保存到数据库
      const savedNft = await this.nftRepository.save(nft);

      // 返回响应DTO
      const nftResponse = NftResponseDto.fromEntity(savedNft);
      return ResponseHelper.success(nftResponse, NFT_SUCCESS_MESSAGES.NFT_CREATED);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof ConflictException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 根据ID获取NFT信息
   * @param id NFT ID
   * @returns Promise<ApiResponse<NftResponseDto>> NFT信息
   * @throws NotFoundException 当NFT不存在时
   */
  async findById(id: number): Promise<ApiResponse<NftResponseDto>> {
    try {
      const nft = await this.nftRepository.findOne({ where: { id } });
      
      if (!nft) {
        throw new NotFoundException(NFT_ERROR_MESSAGES.NFT_NOT_FOUND);
      }

      const nftResponse = NftResponseDto.fromEntity(nft);
      return ResponseHelper.success(nftResponse, NFT_SUCCESS_MESSAGES.NFT_FOUND);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
    }
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
      return ResponseHelper.success(nftResponses, NFT_SUCCESS_MESSAGES.NFT_LIST_FOUND);
    } catch (error) {
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 根据状态获取NFT列表
   * @param status NFT状态
   * @returns Promise<ApiResponse<NftResponseDto[]>> NFT列表
   */
  async findByStatus(status: NftStatus): Promise<ApiResponse<NftResponseDto[]>> {
    try {
      const nfts = await this.nftRepository.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });

      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));
      return ResponseHelper.success(
        nftResponses, 
        NFT_SUCCESS_MESSAGES.NFT_LIST_BY_STATUS_FOUND(status)
      );
    } catch (error) {
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
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
    try {
      // 检查NFT类型是否存在且状态为active
      const nft = await this.nftRepository.findOne({
        where: { id: createNftInstanceDto.nftId, status: NFT_STATUS.ACTIVE },
      });

      if (!nft) {
        throw new NotFoundException(NFT_ERROR_MESSAGES.NFT_TYPE_NOT_FOUND_OR_INACTIVE);
      }

      // 创建新的NFT实例
      const nftInstance = this.nftInstanceRepository.create({
        nftId: createNftInstanceDto.nftId,
        ownerId: userId,
        price: createNftInstanceDto.price,
        status: createNftInstanceDto.status || NFT_INSTANCE_STATUS.AVAILABLE,
      });

      // 保存到数据库并立即查询关联数据（性能优化：单次查询）
      const savedNftInstance = await this.nftInstanceRepository.save(nftInstance);
      
      // 优化：使用单次查询获取完整信息
      const nftInstanceWithRelations = await this.nftInstanceRepository.findOne({
        where: { id: savedNftInstance.id },
        relations: ['nft', 'owner'],
      });

      if (!nftInstanceWithRelations) {
        throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_INSTANCE_CREATE_QUERY_FAILED);
      }

      // 返回响应DTO
      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstanceWithRelations);
      return ResponseHelper.success(nftInstanceResponse, NFT_SUCCESS_MESSAGES.NFT_INSTANCE_CREATED);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_INSTANCE_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 获取NFT实例列表
   * @param status 可选的状态筛选参数
   * @returns Promise<ApiResponse<NftInstanceResponseDto[]>> NFT实例列表
   */
  async findAllNftInstances(
    status?: NftInstanceStatus
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
        ? NFT_SUCCESS_MESSAGES.NFT_INSTANCE_LIST_BY_STATUS_FOUND(status)
        : NFT_SUCCESS_MESSAGES.NFT_INSTANCE_LIST_FOUND;
      
      return ResponseHelper.success(nftInstanceResponses, message);
    } catch (error) {
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_INSTANCE_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 根据ID获取NFT实例详情
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情
   * @throws NotFoundException 当NFT实例不存在时
   */
  async findNftInstanceById(id: number): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      const nftInstance = await this.nftInstanceRepository.findOne({
        where: { id },
        relations: ['nft', 'owner'],
      });

      if (!nftInstance) {
        throw new NotFoundException(NFT_ERROR_MESSAGES.NFT_INSTANCE_NOT_FOUND);
      }

      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstance);
      return ResponseHelper.success(nftInstanceResponse, NFT_SUCCESS_MESSAGES.NFT_INSTANCE_FOUND);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_INSTANCE_LIST_QUERY_FAILED, error.message);
    }
  }
}
