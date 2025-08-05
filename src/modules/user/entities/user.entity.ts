import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 用户实体
 * 定义用户表的结构和字段
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ length: 255 })
  password: string;

  @Column({ nullable: true, length: 255 })
  email?: string;

  @Column({ nullable: true, length: 50 })
  nickname?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}