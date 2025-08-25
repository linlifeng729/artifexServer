import { Injectable, NotFoundException, InternalServerErrorException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { CreateNftInstanceDto } from '@/modules/nft/dto/create-nft-instance.dto';
import { NftInstanceResponseDto } from '@/modules/nft/dto/nft-instance-response.dto';
import { ResponseHelper, ApiResponse } from '@/common';
import { 
  NFT_INSTANCE_STATUS, 
  NftInstanceStatus
} from '@/modules/nft/constants';
import { NftTypesService } from './nft-types.service';

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
      await this.nftTypesService.validateNftTypeExists(createNftInstanceDto.nftId);

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
   * 获取NFT实例列表
   * @param status 可选的状态筛选参数
   * @param page 页码，默认为1
   * @param limit 每页条数，默认为10
   * @returns Promise<ApiResponse<分页结果>> NFT实例分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async getNftInstanceList(
    status?: NftInstanceStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<any>> {
    try {
      const whereCondition = status ? { status } : {};
      const skip = (page - 1) * limit;
      
      const [nftInstances, total] = await this.nftInstanceRepository.findAndCount({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      const nftInstanceResponses = nftInstances.map(instance => 
        NftInstanceResponseDto.fromEntity(instance)
      );
      
      const message = status 
        ? `状态为${status}的NFT商品列表查询成功`
        : 'NFT商品列表查询成功';
      
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
   * 根据ID获取NFT实例详情
   * @param id NFT实例ID
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> NFT实例详情
   * @throws NotFoundException 当NFT实例不存在时
   * @throws InternalServerErrorException 当数据库操作失败时
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
   * 根据用户ID获取用户发布的NFT实例列表
   * @param userId 用户ID
   * @param status 可选的状态筛选参数
   * @param page 页码，默认为1
   * @param limit 每页条数，默认为10
   * @returns Promise<ApiResponse<any>> 用户的NFT实例分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async getNftInstanceListByOwner(
    userId: number,
    status?: NftInstanceStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<any>> {
    try {
      const whereCondition = status 
        ? { ownerId: userId, status } 
        : { ownerId: userId };
      const skip = (page - 1) * limit;
      
      const [nftInstances, total] = await this.nftInstanceRepository.findAndCount({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: { createdAt: 'DESC' },
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

  /**
   * 根据NFT类型ID获取实例列表
   * @param nftId NFT类型ID
   * @param status 可选的状态筛选参数
   * @param page 页码，默认为1
   * @param limit 每页条数，默认为10
   * @returns Promise<ApiResponse<any>> 指定NFT类型的实例分页列表
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async getNftInstanceListByType(
    nftId: number,
    status?: NftInstanceStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<any>> {
    try {
      const whereCondition = status 
        ? { nftId, status } 
        : { nftId };
      const skip = (page - 1) * limit;
      
      const [nftInstances, total] = await this.nftInstanceRepository.findAndCount({
        where: whereCondition,
        relations: ['nft', 'owner'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      const nftInstanceResponses = nftInstances.map(instance => 
        NftInstanceResponseDto.fromEntity(instance)
      );
      
      const message = status 
        ? `NFT类型${nftId}状态为${status}的商品列表查询成功`
        : `NFT类型${nftId}的商品列表查询成功`;
      
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
   * 更新NFT实例状态（内部方法，可用于交易等场景）
   * @param instanceId NFT实例ID
   * @param newStatus 新的状态
   * @returns Promise<ApiResponse<NftInstanceResponseDto>> 更新后的NFT实例信息
   * @throws NotFoundException 当NFT实例不存在时
   * @throws InternalServerErrorException 当数据库操作失败时
   */
  async updateNftInstanceStatus(
    instanceId: number, 
    newStatus: NftInstanceStatus
  ): Promise<ApiResponse<NftInstanceResponseDto>> {
    try {
      // 先检查实例是否存在
      const nftInstance = await this.nftInstanceRepository.findOne({
        where: { id: instanceId },
        relations: ['nft', 'owner'],
      });

      if (!nftInstance) {
        throw new NotFoundException('NFT商品不存在');
      }

      // 更新状态
      nftInstance.status = newStatus;
      const updatedInstance = await this.nftInstanceRepository.save(nftInstance);

      const nftInstanceResponse = NftInstanceResponseDto.fromEntity(updatedInstance);
      return ResponseHelper.success(nftInstanceResponse, `NFT实例状态更新为${newStatus}成功`);
    } catch (error) {
      // 重新抛出已知的业务异常
      if (error instanceof NotFoundException) {
        throw error;
      }
      // 处理未知异常
      throw new InternalServerErrorException('NFT实例状态更新失败', error.message);
    }
  }
}
