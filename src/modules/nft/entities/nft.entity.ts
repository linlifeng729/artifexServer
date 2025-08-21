import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NFT_STATUS_VALUES, NFT_CONSTRAINTS, NftStatus } from '@/modules/nft/constants';

/**
 * NFT实体
 * 基于数据库表结构定义NFT数据模型
 */
@Entity('nft')
export class Nft {
  @PrimaryGeneratedColumn({ comment: 'NFT ID' })
  id: number;

  @Column({ 
    type: 'varchar', 
    length: NFT_CONSTRAINTS.NAME_MAX_LENGTH, 
    nullable: false, 
    comment: 'NFT名称' 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH, 
    nullable: false, 
    comment: 'NFT图片URL' 
  })
  image: string;

  @Column({ 
    type: 'varchar', 
    length: NFT_CONSTRAINTS.TYPE_MAX_LENGTH, 
    nullable: false, 
    comment: 'NFT类型' 
  })
  type: string;

  @Column({ 
    type: 'enum', 
    enum: NFT_STATUS_VALUES, 
    default: 'active',
    comment: 'NFT状态' 
  })
  status: NftStatus;

  @CreateDateColumn({ 
    type: 'timestamp', 
    comment: '创建时间' 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    type: 'timestamp', 
    comment: '更新时间' 
  })
  updatedAt: Date;
}
