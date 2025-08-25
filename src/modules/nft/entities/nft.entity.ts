import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { NFT_STATUS_VALUES, NFT_CONSTRAINTS, NftStatus } from '@/modules/nft/constants';
import { NftInstance } from './nft-instance.entity';

/**
 * NFT实体
 * 基于数据库表结构定义NFT数据模型
 * 表示NFT类型模板，一个NFT类型可以有多个NFT实例
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
    comment: 'NFT状态：active-激活，inactive-未激活' 
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

  // 关系映射：一个NFT类型可以有多个NFT实例
  @OneToMany(() => NftInstance, nftInstance => nftInstance.nft, {
    cascade: false,
    eager: false,
    onDelete: 'CASCADE'
  })
  instances: NftInstance[];
}
