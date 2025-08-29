import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResponseHelper } from '@/common';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { ApiResponse } from '@/common';
import {
  NFT_INSTANCE_STATUS,
  NFT_SORT_OPTIONS,
  PAGINATION_CONSTRAINTS,
} from '@/modules/nft/constants';
import { NftTypesService } from './nft-types.service';
import { QueryNftInstancesDto } from '@/modules/nft/dto/query-nft-instances.dto';

/**
 * NFT实例服务类
 * 专门处理NFT实例/商品相关的业务逻辑（用户功能）
 * 
 * 职责：
 * - 创建NFT商品实例
 * - 查询NFT实例信息
 * - 管理NFT实例状态
 * - 处理NFT交易相关逻辑
 */
@Injectable()
export class NftInstancesService {
  constructor(
    @InjectRepository(NftInstance)
    private readonly nftInstanceRepository: Repository<NftInstance>,
    @Inject(forwardRef(() => NftTypesService))
    private readonly nftTypesService: NftTypesService,
  ) {}

  /**
   * 创建NFT实例（发布商品）
   * @param createNftInstanceDto 创建NFT实例的数据
   * @param userId 当前登录用户的数字ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> 创建成功的NFT实例信息
   * @throws NotFoundException 当NFT类型不存在或已下架时
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async createNftInstance(
    createNftInstanceDto: CreateNftInstanceDto, 
    userId: number
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      // 验证NFT类型是否存在且可用
      await this.nftTypesService._validateNftTypeExists(createNftInstanceDto.nftId);

      // 创建新的NFT实例
      const nftInstance = this.nftInstanceRepository.create({
        nftId: createNftInstanceDto.nftId,
        nftNumber: createNftInstanceDto.nftNumber,
        ownerId: userId,
        price: createNftInstanceDto.price,
        status: createNftInstanceDto.status || NFT_INSTANCE_STATUS.AVAILABLE,
        remark: createNftInstanceDto.remark,
      });

      // 保存到数据库并立即查询关联数据（性能优化：单次查询）
      const savedNftInstance = await this.nftInstanceRepository.save(nftInstance);
      
      // 优化：使用单次查询获取完整信息
      const nftInstanceWithRelations = await this.nftInstanceRepository.findOne({
        where: { id: savedNftInstance.id },
        relations: ['nft', 'owner'],
      });

      if (!nftInstanceWithRelations) {
        throw new InternalServerErrorException('NFT实例创建后查询失败');
      }

      // 返回响应DTO
      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstanceWithRelations);
      return ResponseHelper.success(nftInstanceResponse, 'NFT商品发布成功');
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException('NFT商品列表查询失败，请稍后重试', error.message);
    }
  }

    /**
   * 获取在售商品实例列表（公开访问）
   * 
   * 支持多种查询条件：
   * - nftTypeId: NFT类型ID过滤（可选）
   * - status: NFT实例状态过滤（available | sold | reserved）
   * - sort: 排序方式（latest | price_low_to_high | price_high_to_low），默认为latest
   * - page: 页码（默认为1）
   * - limit: 每页条数（默认为10，最大100）
   * 
   * 排序选项说明：
   * - latest: 最新发布（默认排序）
   * - price_low_to_high: 按价格从低到高排序
   * - price_high_to_low: 按价格从高到低排序
   * 
   * @param queryDto 查询条件DTO
   * @returns Promise<ApiResponse<分页数据>> NFT实例列表
   */
  async getNftInstanceList(
    queryDto: QueryNftInstancesDto
  ): Promise<ApiResponse<{
    list: NftInstanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const { 
        nftTypeId, 
        status = NFT_INSTANCE_STATUS.AVAILABLE, 
        sort = NFT_SORT_OPTIONS.LATEST, 
        page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE, 
        limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT 
      } = queryDto;
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const whereCondition: any = {};
      
      // 按NFT类型过滤
      if (nftTypeId) {
        whereCondition.nftId = nftTypeId;
      }
      
      // 按状态过滤
      if (status) {
        whereCondition.status = status;
      }
      
      // 应用排序
      const orderCondition = this.applySorting(sort);
      
      const [nftInstances, total] = await this.nftInstanceRepository.findAndCount({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: orderCondition,
        skip,
        take: limit,
      });

      const nftInstanceResponses = nftInstances.map(instance => 
        NftInstanceResponseDto.fromEntity(instance)
      );
      
      // 根据查询条件生成相应的消息
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
        message
      );
    } catch (error) {
      throw new InternalServerErrorException('NFT商品列表查询失败，请稍后重试', error.message);
    }
  }

  /**
   * 应用排序逻辑
   * @param sort 排序方式
   * @returns 排序条件对象
   */
  private applySorting(sort: string): any {
    switch (sort) {
      case NFT_SORT_OPTIONS.PRICE_LOW_TO_HIGH:
        // 按价格升序排序
        return { price: 'ASC', createdAt: 'DESC' };
      case NFT_SORT_OPTIONS.PRICE_HIGH_TO_LOW:
        // 按价格降序排序
        return { price: 'DESC', createdAt: 'DESC' };
      case NFT_SORT_OPTIONS.LATEST:
      default:
        // 默认按最新发布排序
        return { createdAt: 'DESC' };
    }
  }

  /**
   * 获取在售商品实例详情（公开访问）
   * 
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情信息
   */
  async findNftInstanceById(id: number): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      const nftInstance = await this.nftInstanceRepository.findOne({
        where: { id },
        relations: ['nft', 'owner'],
      });

      if (!nftInstance) {
        throw new NotFoundException('NFT商品不存在');
      }

      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(nftInstance);
      return ResponseHelper.success(nftInstanceResponse, 'NFT商品详情查询成功');
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException('NFT商品列表查询失败，请稍后重试', error.message);
    }
  }

  /**
   * 根据拥有者获取NFT实例列表（用户权限）
   * 
   * @param userId 用户ID
   * @param queryDto 查询条件DTO
   * @returns Promise<ApiResponse<分页数据>> NFT实例列表
   */
  async getNftInstanceListByOwner(
    userId: number,
    queryDto: QueryNftInstancesDto
  ): Promise<ApiResponse<{
    list: NftInstanceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    try {
      const { status = NFT_INSTANCE_STATUS.AVAILABLE, sort = NFT_SORT_OPTIONS.LATEST, page = PAGINATION_CONSTRAINTS.DEFAULT_PAGE, limit = PAGINATION_CONSTRAINTS.DEFAULT_LIMIT } = queryDto;
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const whereCondition = status 
        ? { ownerId: userId, status } 
        : { ownerId: userId };
      
      // 应用排序
      const orderCondition = this.applySorting(sort);
      
      const [nftInstances, total] = await this.nftInstanceRepository.findAndCount({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: orderCondition,
        skip,
        take: limit,
      });

      const nftInstanceResponses = nftInstances.map(instance => 
        NftInstanceResponseDto.fromEntity(instance)
      );
      
      const message = status 
        ? `用户状态为${status}的NFT商品列表查询成功`
        : '用户NFT商品列表查询成功';
      
      return ResponseHelper.paginated(
        nftInstanceResponses,
        total,
        page,
        limit,
        message
      );
    } catch (error) {
      throw new InternalServerErrorException('NFT商品列表查询失败，请稍后重试', error.message);
    }
  }
}
