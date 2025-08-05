import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 用户实体
 * 定义用户表的结构和字段
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 11, comment: '手机号' })
  phone: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true, length: 50 })
  nickname?: string;

  @Column({ 
    type: 'enum', 
    enum: ['user', 'admin'], 
    default: 'user',
    comment: '用户角色：user-普通用户，admin-管理员'
  })
  role: 'user' | 'admin';

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}