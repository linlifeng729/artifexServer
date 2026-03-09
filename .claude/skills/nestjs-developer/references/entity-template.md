# Entity 模板

## 基础结构

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { XXX_CONSTANTS } from '@/modules/xxx/constants'

/**
 * XXX 实体
 * 定义 xxx 表的结构和字段
 */
@Entity('xxx')
export class XxxEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ length: 100, comment: '名称' })
  name: string

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description?: string

  @Column({ length: 500, nullable: true, comment: '图片 URL' })
  imageUrl?: string

  @Column({ 
    type: 'enum', 
    enum: Object.values(XXX_CONSTANTS.STATUS),
    default: XXX_CONSTANTS.STATUS.ACTIVE,
    comment: '状态'
  })
  status: number

  @Column({ type: 'tinyint', width: 1, default: 1, comment: '是否激活' })
  isActive: boolean

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}
```

## 使用 UUID 主键

```typescript
@PrimaryGeneratedColumn('uuid')
id: string
```

## 使用自增主键

```typescript
@PrimaryGeneratedColumn()
id: number
```

## 关联关系（一对多）

```typescript
// 父实体
@OneToMany(() => ChildEntity, (child) => child.parent)
children: ChildEntity[]

// 子实体
@ManyToOne(() => ParentEntity, (parent) => parent.children)
@JoinColumn({ name: 'parentId' })
parent: ParentEntity
```

## 字段类型参考

| 数据库类型 | TypeORM 类型 |
|----------|-------------|
| INT | number |
| VARCHAR | string |
| TEXT | string |
| TINYINT | number |
| DATETIME | Date |
| TIMESTAMP | Date |
| ENUM | enum |
| DECIMAL | number |
| JSON | object |

