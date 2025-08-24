import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { ResponseHelper, ApiResponse } from '@/common';
import { LoggingService } from '@/common/services/logging.service';
import { 
  NFT_STATUS, 
  NFT_ERROR_MESSAGES, 
  NFT_SUCCESS_MESSAGES,
  NftStatus
} from '@/modules/nft/constants';

/**
 * NFT类型服务类
 * 专门处理NFT模板/类型相关的业务逻辑（管理员功能）
 * 
 * 职责：
 * - 创建NFT类型模板
 * - 查询NFT类型信息
 * - 管理NFT类型状态
 */
@Injectable()
export class NftTypesService {
  constructor(
    @InjectRepository(Nft)
    private readonly nftRepository: Repository<Nft>,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * 创建新的NFT类型模板
   * @param createNftDto 创建NFT的数据
   * @returns Promise<ApiResponse<NftResponseDto>> 创建成功的NFT信息
   * @throws ConflictException 当NFT名称已存在时
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async createNftType(createNftDto: CreateNftDto): Promise<ApiResponse<NftResponseDto>> {
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
   * 根据ID获取NFT类型信息
   * @param id NFT类型ID
   * @returns Promise<ApiResponse<NftResponseDto>> NFT类型信息
   * @throws NotFoundException 当NFT类型不存在时
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async findNftTypeById(id: number): Promise<ApiResponse<NftResponseDto>> {
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
   * 获取所有NFT类型列表
   * @param page 页码，默认为1
   * @param limit 每页条数，默认为10
   * @returns Promise<ApiResponse<any>> NFT类型分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async findAllNftTypes(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const skip = (page - 1) * limit;
      
      const [nfts, total] = await this.nftRepository.findAndCount({
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));
      return ResponseHelper.paginated(
        nftResponses,
        total,
        page,
        limit,
        NFT_SUCCESS_MESSAGES.NFT_LIST_FOUND
      );
    } catch (error) {
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 根据状态获取NFT类型列表
   * @param status NFT状态
   * @param page 页码，默认为1
   * @param limit 每页条数，默认为10
   * @returns Promise<ApiResponse<any>> 指定状态的NFT类型分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async findNftTypesByStatus(status: NftStatus, page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
    try {
      const skip = (page - 1) * limit;
      
      const [nfts, total] = await this.nftRepository.findAndCount({
        where: { status },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));
      return ResponseHelper.paginated(
        nftResponses,
        total,
        page,
        limit,
        NFT_SUCCESS_MESSAGES.NFT_LIST_BY_STATUS_FOUND(status)
      );
    } catch (error) {
      throw new InternalServerErrorException(NFT_ERROR_MESSAGES.NFT_LIST_QUERY_FAILED, error.message);
    }
  }

  /**
   * 验证NFT类型是否存在且可用（内部方法）
   * @param nftId NFT类型ID
   * @returns Promise<Nft> NFT实体
   * @throws NotFoundException 当NFT类型不存在或已下架时
   */
  async validateActiveNftType(nftId: number): Promise<Nft> {
    const nft = await this.nftRepository.findOne({
      where: { id: nftId, status: NFT_STATUS.ACTIVE },
    });

    if (!nft) {
      throw new NotFoundException(NFT_ERROR_MESSAGES.NFT_TYPE_NOT_FOUND_OR_INACTIVE);
    }

    return nft;
  }
}
