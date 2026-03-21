# Service 模板

## 基础结构

```typescript
// src/modules/xxx/services/xxx.service.ts
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { XxxEntity } from '@/modules/xxx/entities/xxx.entity'
import { CreateXxxDto } from '@/modules/xxx/dto/create-xxx.dto'
import { ResponseHelper } from '@/common/utils/response.helper'
import { XXX_CONSTANTS } from '@/modules/xxx/constants'
import { ApiResponse } from '@/common/interceptors/response.interceptor'
import { PublicXxx, XxxPaginatedResult } from '@/modules/xxx/types/xxx.types'

/**
 * XXX 服务
 * 负责 XXX 业务逻辑处理
 */
@Injectable()
export class XxxService {
  constructor(
    @InjectRepository(XxxEntity)
    private readonly xxxRepository: Repository<XxxEntity>,
  ) {}

  /**
   * 获取 XXX 列表（分页）
   */
  async getXxxList(
    page: number = XXX_CONSTANTS.PAGINATION.DEFAULT_PAGE,
    limit: number = XXX_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  ): Promise<ApiResponse<XxxPaginatedResult>> {
    const safeLimit = Math.min(limit, XXX_CONSTANTS.PAGINATION.MAX_LIMIT)

    const [list, total] = await this.xxxRepository.findAndCount({
      where: { isActive: true },
      skip: (page - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: 'DESC' },
    })

    return ResponseHelper.paginated(list, total, page, safeLimit, '查询成功')
  }

  /**
   * 根据 ID 获取 XXX 详情
   */
  async getXxxById(id: number): Promise<ApiResponse<PublicXxx | null>> {
    try {
      const entity = await this.xxxRepository.findOne({
        where: { id, isActive: true },
      })

      if (!entity) {
        throw new NotFoundException('资源不存在')
      }

      return ResponseHelper.success(entity, '查询成功')
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('查询失败', { cause: error })
    }
  }

  /**
   * 创建 XXX
   */
  async createXxx(
    createDto: CreateXxxDto,
    userId?: number,
  ): Promise<ApiResponse<PublicXxx>> {
    try {
      const entity = this.xxxRepository.create({
        ...createDto,
        createdBy: userId,
      })

      const saved = await this.xxxRepository.save(entity)
      return ResponseHelper.success(saved, '创建成功')
    } catch (error) {
      throw new InternalServerErrorException('创建失败', { cause: error })
    }
  }

  /**
   * 更新 XXX
   */
  async updateXxx(
    id: number,
    updateDto: Partial<CreateXxxDto>,
  ): Promise<ApiResponse<PublicXxx>> {
    try {
      const entity = await this.xxxRepository.findOne({ where: { id, isActive: true } })

      if (!entity) {
        throw new NotFoundException('资源不存在')
      }

      Object.assign(entity, updateDto)
      const saved = await this.xxxRepository.save(entity)

      return ResponseHelper.success(saved, '更新成功')
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('更新失败', { cause: error })
    }
  }

  /**
   * 删除 XXX（软删除）
   */
  async deleteXxx(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
    try {
      const entity = await this.xxxRepository.findOne({ where: { id, isActive: true } })

      if (!entity) {
        throw new NotFoundException('资源不存在')
      }

      entity.isActive = false
      await this.xxxRepository.save(entity)

      return ResponseHelper.success({ deleted: true }, '删除成功')
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException('删除失败', { cause: error })
    }
  }
}
```

## 常用查询模式

### 使用 QueryBuilder 复杂查询

```typescript
async searchXxx(params: QueryXxxDto): Promise<ApiResponse<XxxPaginatedResult>> {
  const { page = 1, limit = 10, status, name } = params
  const safeLimit = Math.min(limit, XXX_CONSTANTS.PAGINATION.MAX_LIMIT)

  const queryBuilder = this.xxxRepository.createQueryBuilder('xxx')
    .where('xxx.isActive = :isActive', { isActive: true })

  if (status) {
    queryBuilder.andWhere('xxx.status = :status', { status })
  }

  if (name) {
    queryBuilder.andWhere('xxx.name LIKE :name', { name: `%${name}%` })
  }

  queryBuilder
    .orderBy('xxx.createdAt', 'DESC')
    .skip((page - 1) * safeLimit)
    .take(safeLimit)

  const [list, total] = await queryBuilder.getManyAndCount()

  return ResponseHelper.paginated(list, total, page, safeLimit, '查询成功')
}
```

### 关联查询

```typescript
async getXxxWithRelations(id: number): Promise<ApiResponse<any>> {
  const entity = await this.xxxRepository.findOne({
    where: { id, isActive: true },
    relations: ['category', 'tags'],
    select: ['id', 'name', 'createdAt', 'category', 'tags'],
  })

  if (!entity) {
    throw new NotFoundException('资源不存在')
  }

  return ResponseHelper.success(entity, '查询成功')
}
```

## 错误处理规范

```typescript
// ✅ 推荐：使用内置异常 + cause
throw new NotFoundException('资源不存在')
throw new BadRequestException('参数错误')
throw new InternalServerErrorException('服务异常', { cause: error })

// ❌ 避免：返回错误码或未包装的异常
return { success: false, code: 404 }
throw new Error('资源不存在')
```

## 响应格式化

```typescript
// 成功响应
return ResponseHelper.success(data, '操作成功')

// 分页响应
return ResponseHelper.paginated(list, total, page, limit, '查询成功')

// 抛出异常（由全局过滤器处理）
throw new NotFoundException('资源不存在')
```
