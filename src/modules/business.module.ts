import { Module } from '@nestjs/common';
import { UserModule } from '@/modules/user/user.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { NftModule } from '@/modules/nft/nft.module';

/**
 * 业务模块聚合模块
 * 用于集中管理所有业务模块，新增模块时在此处添加
 */
@Module({
  imports: [UserModule, AuthModule, NftModule],
  exports: [UserModule, AuthModule, NftModule],
})
export class BusinessModule {}
