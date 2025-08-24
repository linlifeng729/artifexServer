import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { QueryNftTypesDto } from '@/modules/nft/dto/query-nft-types.dto';
import { ResponseHelper, ApiResponse } from '@/common';
import { LoggingService } from '@/common/services/logging.service';
import { 
  NFT_STATUS, 
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
        throw new ConflictException('NFT名称已存在');
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
      return ResponseHelper.success(nftResponse, 'NFT创建成功');
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof ConflictException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException('NFT创建失败，请稍后重试', error.message);
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
        throw new NotFoundException('NFT不存在');
      }

      const nftResponse = NftResponseDto.fromEntity(nft);
      return ResponseHelper.success(nftResponse, 'NFT查询成功');
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException('NFT列表查询失败，请稍后重试', error.message);
    }
  }

  /**
   * NFT类型查询方法
   * 支持多种过滤条件的组合查询
   * @param queryDto 查询条件DTO
   * @returns Promise<ApiResponse<any>> NFT类型分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async queryNftTypes(queryDto: QueryNftTypesDto): Promise<ApiResponse<{ 
    list: NftResponseDto[], 
    total: number, 
    page: number, 
    limit: number,
    totalPages: number
  }>> {
    try {
      const { status, name, type, page, limit } = queryDto;
      const skip = (page - 1) * limit;

      // 构建查询条件
      const queryBuilder: SelectQueryBuilder<Nft> = this.nftRepository
        .createQueryBuilder('nft')
        .orderBy('nft.createdAt', 'DESC');

      // 添加状态过滤
      if (status) {
        queryBuilder.andWhere('nft.status = :status', { status });
      }

      // 添加名称模糊搜索
      if (name) {
        queryBuilder.andWhere('nft.name LIKE :name', { name: `%${name}%` });
      }

      // 添加类型过滤
      if (type) {
        queryBuilder.andWhere('nft.type = :type', { type });
      }

      // 应用分页
      queryBuilder.skip(skip).take(limit);

      // 执行查询
      const [nfts, total] = await queryBuilder.getManyAndCount();

      // 转换为响应DTO
      const nftResponses = nfts.map(nft => NftResponseDto.fromEntity(nft));

      // 构建成功消息
      const message = status 
        ? `状态为${status}的NFT列表查询成功`
        : 'NFT列表查询成功';

      return ResponseHelper.paginated(
        nftResponses,
        total,
        page,
        limit,
        message
      );
    } catch (error) {
      throw new InternalServerErrorException('NFT列表查询失败，请稍后重试', error.message);
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
      throw new NotFoundException('NFT类型不存在或已下架');
    }

    return nft;
  }
}
