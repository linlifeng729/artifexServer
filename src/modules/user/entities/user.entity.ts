import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 用户实体
 * 定义用户表的结构和字段
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, comment: '加密的手机号' })
  phone: string;

  @Column({ unique: true, length: 64, comment: '手机号哈希值' })
  phoneHash: string;

  @Column({ nullable: true, length: 50 })
  nickname?: string;

  @Column({ nullable: true, length: 10, comment: '验证码' })
  verificationCode?: string;

  @Column({ type: 'timestamp', nullable: true, comment: '验证码过期时间' })
  verificationCodeExpiredAt?: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '上次发送验证码时间' })
  lastCodeSentAt?: Date;

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