import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Nft } from './nft.entity';
import { User } from '../../user/entities/user.entity';
import { NFT_INSTANCE_STATUS_VALUES, NftInstanceStatus } from '@/modules/nft/constants';

/**
 * NFT实例实体
 * 表示具体的在售NFT实例
 */
@Entity('nft_instance')
export class NftInstance {
  @PrimaryGeneratedColumn({ comment: 'NFT实例ID' })
  id: number;

  @Column({ 
    name: 'nftId',
    type: 'int', 
    nullable: false, 
    comment: '关联的NFT类型ID' 
  })
  nftId: number;

  @Column({ 
    name: 'nftNumber',
    type: 'varchar', 
    length: 50,
    nullable: true, 
    comment: 'NFT编号' 
  })
  nftNumber: string;

  @Column({ 
    name: 'ownerId',
    type: 'int', 
    nullable: true, 
    comment: '拥有者用户ID' 
  })
  ownerId: number;

  @Column({ 
    type: 'int', 
    nullable: false, 
    default: 0,
    comment: '当前价格（分）' 
  })
  price: number;

  @Column({ 
    type: 'enum', 
    enum: NFT_INSTANCE_STATUS_VALUES, 
    default: 'available',
    comment: '可售、已售、预留' 
  })
  status: NftInstanceStatus;

  @Column({ 
    type: 'text', 
    nullable: true, 
    comment: '备注信息' 
  })
  remark: string;

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

  // 关系映射
  @ManyToOne(() => Nft, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nftId' })
  nft: Nft;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ownerId', referencedColumnName: 'userId' })
  owner: User;
}
