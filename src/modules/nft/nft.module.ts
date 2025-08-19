import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftController } from '@/modules/nft/nft.controller';
import { NftService } from '@/modules/nft/services/nft.service';
import { Nft } from '@/modules/nft/entities/nft.entity';
import { NftInstance } from '@/modules/nft/entities/nft-instance.entity';
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard';

/**
 * NFT模块
 * 
 * 提供NFT相关的功能，包括：
 * - NFT的创建、查询等基本操作
 * - 管理员权限控制
 * - 数据持久化
 */
@Module({
  imports: [
    // 注册NFT实体，启用TypeORM功能
    TypeOrmModule.forFeature([Nft, NftInstance]),
  ],
  controllers: [
    NftController,
  ],
  providers: [
    NftService,
    AdminOnlyGuard,
  ],
  exports: [
    NftService,
    AdminOnlyGuard,
  ],
})
export class NftModule {}
