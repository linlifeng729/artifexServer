import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftTypesController } from '@/modules/nft/controllers/nft-types.controller';
import { NftInstancesController } from '@/modules/nft/controllers/nft-instances.controller';
import { NftTypesService } from '@/modules/nft/services/nft-types.service';
import { NftInstancesService } from '@/modules/nft/services/nft-instances.service';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';
import { AuthModule } from '@/modules/auth/auth.module';

/**
 * NFT模块
 * 
 * 提供NFT相关的功能，采用分层架构设计：
 * 
 * 控制器层：
 * - NftTypesController: 处理NFT类型模板相关请求（管理员功能）
 * - NftInstancesController: 处理NFT商品实例相关请求（用户功能）
 * 
 * 服务层：
 * - NftTypesService: 管理NFT类型模板的业务逻辑
 * - NftInstancesService: 管理NFT商品实例的业务逻辑
 * 
 * 功能特性：
 * - 管理员权限控制
 * - 数据持久化
 * - 职责分离架构
 */
@Module({
  imports: [
    // 注册NFT实体，启用TypeORM功能
    TypeOrmModule.forFeature([Nft, NftInstance]),
    // 导入认证模块，提供AuthService和JwtAuthGuard
    AuthModule,
  ],
  controllers: [
    NftTypesController,
    NftInstancesController,
  ],
  providers: [
    NftTypesService,
    NftInstancesService,
    AdminOnlyGuard,
    Logger,
  ],
  exports: [
    NftTypesService,
    NftInstancesService,
    AdminOnlyGuard,
  ],
})
export class NftModule {}
