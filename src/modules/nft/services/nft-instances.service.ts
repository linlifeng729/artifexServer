import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResponse } from '@/common/interceptors/response.interceptor';
import { ResponseHelper } from '@/common/utils/response.helper';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import {
  NFT_INSTANCE_STATUS,
  NFT_SORT_OPTIONS,
  PAGINATION_CONSTRAINTS,
} from '@/modules/nft/constants';
import { NftTypesService } from './nft-types.service';
import { QueryNftInstancesDto } from '@/modules/nft/dto/query-nft-instances.dto';

/** NFT实例服务类 - 处理NFT实例/商品相关业务逻辑 */
@Injectable()
export class NftInstancesService {
  constructor(
    @InjectRepository(NftInstance)
    private readonly nftInstanceRepository: Repository<NftInstance>,
    @Inject(forwardRef(() => NftTypesService))
    private readonly nftTypesService: NftTypesService,
  ) {}

  /** 创建NFT实例 */
  async createNftInstance(
    createNftInstanceDto: CreateNftInstanceDto,
    userId: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      await this.nftTypesService.validateNftTypeExists(
        createNftInstanceDto.nftId,
      );

      const nftInstance = this.nftInstanceRepository.create({
        nftId: createNftInstanceDto.nftId,
        nftNumber: createNftInstanceDto.nftNumber,
        ownerId: userId,
        price: createNftInstanceDto.price,
        status: createNftInstanceDto.status || NFT_INSTANCE_STATUS.AVAILABLE,
        remark: createNftInstanceDto.remark,
      });

      const savedNftInstance =
        await this.nftInstanceRepository.save(nftInstance);

      const nftInstanceWithRelations = await this.nftInstanceRepository.findOne(
        {
          where: { id: savedNftInstance.id },
          relations: ['nft', 'owner'],
        },
      );

      if (!nftInstanceWithRelations) {
        throw new InternalServerErrorException('NFT实例创建后查询失败');
      }

      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(
        nftInstanceWithRelations,
      );
      return ResponseHelper.success(nftInstanceResponse, 'NFT商品发布成功');
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'NFT商品列表查询失败，请稍后重试',
        error.message,
      );
    }
  }

  /** 获取NFT实例列表 */
  async getNftInstanceList(queryDto: QueryNftInstancesDto): Promise<
    ApiResponse<{
      list: NftInstanceResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    try {
      const {
        nftTypeId,
        status = NFT_INSTANCE_STATUS.AVAILABLE,
        sort = NFT_SORT_OPTIONS.LATEST,
        page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
        limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
      } = queryDto;
      const skip = (page - 1) * limit;

      const whereCondition: any = {};

      if (nftTypeId) {
        whereCondition.nftId = nftTypeId;
      }

      if (status) {
        whereCondition.status = status;
      }

      const orderCondition = this.applySorting(sort);

      const [nftInstances, total] =
        await this.nftInstanceRepository.findAndCount({
          where: whereCondition,
          relations: ['nft', 'owner'],
          order: orderCondition,
          skip,
          take: limit,
        });

      const nftInstanceResponses = nftInstances.map((instance) =>
        NftInstanceResponseDto.fromEntity(instance),
      );

      let message = 'NFT商品列表查询成功';
      if (nftTypeId && status) {
        message = `NFT类型${nftTypeId}状态为${status}的商品列表查询成功`;
      } else if (nftTypeId) {
        message = `NFT类型${nftTypeId}的商品列表查询成功`;
      } else if (status) {
        message = `状态为${status}的NFT商品列表查询成功`;
      }

      return ResponseHelper.paginated(
        nftInstanceResponses,
        total,
        page,
        limit,
        message,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'NFT商品列表查询失败，请稍后重试',
        error.message,
      );
    }
  }

  /** 应用排序 */
  private applySorting(sort: string): any {
    switch (sort) {
      case NFT_SORT_OPTIONS.PRICE_LOW_TO_HIGH:
        return { price: 'ASC', createdAt: 'DESC' };
      case NFT_SORT_OPTIONS.PRICE_HIGH_TO_LOW:
        return { price: 'DESC', createdAt: 'DESC' };
      case NFT_SORT_OPTIONS.LATEST:
      default:
        return { createdAt: 'DESC' };
    }
  }

  /** 获取NFT实例详情 */
  async findNftInstanceById(
    id: number,
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      const nftInstance = await this.nftInstanceRepository.findOne({
        where: { id },
        relations: ['nft', 'owner'],
      });

      if (!nftInstance) {
        throw new NotFoundException('NFT商品不存在');
      }

      const nftInstanceResponse =
        NftInstanceResponseDto.fromEntity(nftInstance);
      return ResponseHelper.success(nftInstanceResponse, 'NFT商品详情查询成功');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'NFT商品列表查询失败，请稍后重试',
        error.message,
      );
    }
  }

  /** 获取用户的NFT实例列表 */
  async getNftInstanceListByOwner(
    userId: number,
    queryDto: QueryNftInstancesDto,
  ): Promise<
    ApiResponse<{
      list: NftInstanceResponseDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>
  > {
    try {
      const {
        status = NFT_INSTANCE_STATUS.AVAILABLE,
        sort = NFT_SORT_OPTIONS.LATEST,
        page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE,
        limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT,
      } = queryDto;
      const skip = (page - 1) * limit;

      const whereCondition = status
        ? { ownerId: userId, status }
        : { ownerId: userId };

      const orderCondition = this.applySorting(sort);

      const [nftInstances, total] =
        await this.nftInstanceRepository.findAndCount({
          where: whereCondition,
          relations: ['nft', 'owner'],
          order: orderCondition,
          skip,
          take: limit,
        });

      const nftInstanceResponses = nftInstances.map((instance) =>
        NftInstanceResponseDto.fromEntity(instance),
      );

      const message = status
        ? `用户状态为${status}的NFT商品列表查询成功`
        : '用户NFT商品列表查询成功';

      return ResponseHelper.paginated(
        nftInstanceResponses,
        total,
        page,
        limit,
        message,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'NFT商品列表查询失败，请稍后重试',
        error.message,
      );
    }
  }
}
