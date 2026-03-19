import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { CreateNftDto } from '@/modules/nft/dto/create-nft.dto';
import { NftResponseDto } from '@/modules/nft/dto/nft-response.dto';
import { QueryNftTypesDto } from '@/modules/nft/dto/query-nft-types.dto';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import { LoggingService } from '@/common/services/logging.service';
import {
  NFT_STATUS,
  NFT_INSTANCE_STATUS,
  PAGINATION_CONSTRAINTS,
  NFT_SORT_OPTIONS,
} from '@/modules/nft/constants';

/** NFT类型服务类 - 处理NFT类型/模板相关业务逻辑 */
@Injectable()
export class NftTypesService {
  constructor(
    @InjectRepository(Nft)
    private readonly nftRepository: Repository<Nft>,
    private readonly loggingService: LoggingService,
  ) {}

  /** 创建NFT类型 */
  async createNftType(
    createNftDto: CreateNftDto,
  ): Promise<ApiResponse<NftResponseDto>> {
    try {
      const existingNft = await this.nftRepository.findOne({
        where: { name: createNftDto.name },
      });

      if (existingNft) {
        throw new ConflictException('NFT名称已存在');
      }

      const nft = this.nftRepository.create({
        name: createNftDto.name,
        image: createNftDto.image,
        type: createNftDto.type,
        status: createNftDto.status || NFT_STATUS.ACTIVE,
      });

      const savedNft = await this.nftRepository.save(nft);

      const nftResponse = NftResponseDto.fromEntity(savedNft);
      return ResponseHelper.success(nftResponse, 'NFT创建成功');
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'NFT创建失败，请稍后重试',
        error.message,
      );
    }
  }

  /** 查询NFT类型列表 */
  async getNftTypeList(queryDto: QueryNftTypesDto): Promise<
    ApiResponse<{
      list: NftResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    try {
      const {
        status = NFT_STATUS.ACTIVE,
        name,
        sort = NFT_SORT_OPTIONS.LATEST,
        page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
        limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
      } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.nftRepository
        .createQueryBuilder('nft')
        .leftJoin(
          'nft.instances',
          'instance',
          'instance.status = :availableStatus',
        )
        .addSelect([
          'COUNT(DISTINCT instance.id) as availableCount',
          'MIN(instance.price) as minPrice',
        ])
        .setParameter('availableStatus', NFT_INSTANCE_STATUS.AVAILABLE)
        .groupBy('nft.id');

      this.applySorting(queryBuilder, sort);

      if (status) {
        queryBuilder.andWhere('nft.status = :nftStatus', { nftStatus: status });
      }

      if (name?.trim()) {
        queryBuilder.andWhere('nft.name LIKE :searchName', {
          searchName: `%${name.trim()}%`,
        });
      }

      queryBuilder.skip(skip).take(limit);

      const [nftsWithStats, total] = await Promise.all([
        queryBuilder.getRawMany(),
        this.getNftCount(queryDto),
      ]);

      const nftResponses = nftsWithStats.map((rawNft) =>
        NftResponseDto.fromRawResult(rawNft),
      );

      const message = status
        ? `状态为${status}的NFT列表查询成功`
        : 'NFT列表查询成功';

      return ResponseHelper.paginated(
        nftResponses,
        total,
        page,
        limit,
        message,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'NFT列表查询失败，请稍后重试',
        error.message,
      );
    }
  }

  /** 应用排序 */
  private applySorting(queryBuilder: any, sort: string): void {
    switch (sort) {
      case NFT_SORT_OPTIONS.PRICE_LOW_TO_HIGH:
        queryBuilder.orderBy('minPrice', 'ASC');
        queryBuilder.addOrderBy('nft.createdAt', 'DESC');
        break;
      case NFT_SORT_OPTIONS.PRICE_HIGH_TO_LOW:
        queryBuilder.orderBy('minPrice', 'DESC');
        queryBuilder.addOrderBy('nft.createdAt', 'DESC');
        break;
      case NFT_SORT_OPTIONS.LATEST:
      default:
        queryBuilder.orderBy('nft.createdAt', 'DESC');
        break;
    }
  }

  /** 获取NFT总数 */
  private async getNftCount(queryDto: QueryNftTypesDto): Promise<number> {
    const { status, name } = queryDto;

    const queryBuilder = this.nftRepository.createQueryBuilder('nft');

    if (status) {
      queryBuilder.andWhere('nft.status = :nftStatus', { nftStatus: status });
    }

    if (name?.trim()) {
      queryBuilder.andWhere('nft.name LIKE :searchName', {
        searchName: `%${name.trim()}%`,
      });
    }

    return queryBuilder.getCount();
  }

  /** 验证NFT类型是否存在且可用 */
  async validateNftTypeExists(nftId: number): Promise<Nft> {
    const nft = await this.nftRepository.findOne({
      where: { id: nftId, status: NFT_STATUS.ACTIVE },
    });

    if (!nft) {
      throw new NotFoundException('NFT类型不存在或已下架');
    }

    return nft;
  }
}
