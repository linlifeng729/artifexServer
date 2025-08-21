import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { USER_CONSTANTS, UserRole } from '@/modules/user/constants';

/**
 * 用户实体
 * 定义用户表的结构和字段
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ 
    type: 'varchar', 
    length: USER_CONSTANTS.CONSTRAINTS.ID_LENGTH, 
    unique: true, 
    comment: '用户UUID' 
  })
  id: string;

  @Column({ 
    length: USER_CONSTANTS.CONSTRAINTS.PHONE_LENGTH, 
    comment: '加密的手机号' 
  })
  phone: string;

  @Column({ 
    unique: true, 
    length: USER_CONSTANTS.CONSTRAINTS.PHONE_HASH_LENGTH, 
    comment: '手机号哈希值' 
  })
  phoneHash: string;

  @Column({ 
    nullable: true, 
    length: USER_CONSTANTS.CONSTRAINTS.NICKNAME_MAX_LENGTH,
    comment: '用户昵称'
  })
  nickname?: string;

  @Column({ 
    nullable: true, 
    length: USER_CONSTANTS.CONSTRAINTS.VERIFICATION_CODE_LENGTH, 
    comment: '验证码' 
  })
  verificationCode?: string;

  @Column({ type: 'timestamp', nullable: true, comment: '验证码过期时间' })
  verificationCodeExpiredAt?: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '上次发送验证码时间' })
  lastCodeSentAt?: Date;

  @Column({ 
    type: 'enum', 
    enum: Object.values(USER_CONSTANTS.ROLES), 
    default: USER_CONSTANTS.ROLES.USER,
    comment: `用户角色：${USER_CONSTANTS.ROLES.USER}-普通用户，${USER_CONSTANTS.ROLES.ADMIN}-管理员`
  })
  role: UserRole;

  @Column({ type: 'tinyint', width: 1, default: 1, comment: '是否激活' })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}