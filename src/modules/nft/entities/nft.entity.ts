import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
    length: 100, 
    nullable: false, 
    comment: 'NFT名称' 
  })
  name: string;

  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: false, 
    comment: 'NFT图片URL' 
  })
  image: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    nullable: false, 
    comment: 'NFT类型' 
  })
  type: string;

  @Column({ 
    type: 'enum', 
    enum: ['active', 'inactive'], 
    default: 'active',
    comment: 'NFT状态' 
  })
  status: 'active' | 'inactive';

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
