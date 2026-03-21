---
name: nestjs-developer
description: NestJS 后端开发规范和流程指南。用于创建新的业务模块时，包括：数据库表设计、Entity 实体创建、Constants 常量定义、Types 类型定义、DTO 数据传输对象（含 Swagger 装饰器）、Services 服务层、Controllers 控制器（含 Swagger 装饰器）、Module 模块注册等完整开发流程。触发场景：(1) 创建新的业务模块 (2) 添加新的数据库表 (3) 开发 CRUD 接口 (4) 需要遵循 NestJS 六层架构开发规范
---

# NestJS 后端开发规范

本 Skill 提供 NestJS 业务模块开发的完整流程指南。

## 完整开发流程（10 步）

```
 1. 创建数据库表 (SQL)           → database/scripts/
 2. 创建 Entity (实体)           → modules/xxx/entities/
 3. 创建 Constants (常量)         → modules/xxx/constants/
 4. 创建 Types (类型定义)        → modules/xxx/types/
 5. 创建 DTO (数据传输对象)     → modules/xxx/dto/
 6. 创建 Services (服务层)       → modules/xxx/services/
 7. 创建 Controllers (控制器)   → modules/xxx/
 8. 创建 Module (模块定义)       → modules/xxx/xxx.module.ts
 9. 配置 Swagger 文档             → DTO + Controller 添加装饰器
10. 注册 Module                  → modules/business.module.ts
```

## 快速开始

### Step 1: 创建数据库表

```sql
-- src/database/scripts/create-xxx-table.sql
CREATE TABLE `xxx` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '名称',
  `description` varchar(500) COMMENT '描述',
  `status` tinyint DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `is_active` tinyint DEFAULT 1 COMMENT '是否激活',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='XXX表';
```

**注意事项**：
- 使用有意义的表名和字段注释
- 必填字段使用 NOT NULL
- 添加适当的索引（KEY）
- 建议使用 is_active 字段实现软删除

### Step 2: 创建 Entity

详见 [entity-template.md](references/entity-template.md)

### Step 3: 创建 Constants

详见 [constants-template.md](references/constants-template.md)

### Step 4: 创建 Types

```typescript
// src/modules/xxx/types/xxx.types.ts

/**
 * 公开类型（不含敏感字段）
 */
export interface PublicXxx {
  id: number
  name: string
  description?: string
  status: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 内部类型（包含敏感字段）
 */
export interface InternalXxx extends PublicXxx {
  // 添加敏感字段
}

/**
 * 分页结果类型
 */
export interface XxxPaginatedResult {
  list: PublicXxx[]
  total: number
  pageNum: number
  pageSize: number
}
```

### Step 5: 创建 DTO

```typescript
// src/modules/xxx/dto/create-xxx.dto.ts
import { IsString, IsEnum, IsNotEmpty, MaxLength, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { XXX_CONSTANTS } from '@/modules/xxx/constants'

export class CreateXxxDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(XXX_CONSTANTS.CONSTRAINTS.NAME_MAX_LENGTH)
  name: string

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  @MaxLength(XXX_CONSTANTS.CONSTRAINTS.DESCRIPTION_MAX_LENGTH)
  description?: string

  @ApiPropertyOptional({ description: '状态', enum: Object.values(XXX_CONSTANTS.STATUS) })
  @IsOptional()
  @IsEnum(XXX_CONSTANTS.STATUS)
  status?: string
}
```

### Step 6: 创建 Services

详见 [service-template.md](references/service-template.md)

### Step 7: 创建 Controllers

详情参考 [controller-template.md](references/controller-template.md)

### Step 8: 创建 Module

详见 [module-template.md](references/module-template.md)

### Step 9: 注册 Module

在 `src/modules/business.module.ts` 中导入新模块：

```typescript
import { Module } from '@nestjs/common'
import { XxxModule } from './xxx/xxx.module'

@Module({
  imports: [
    // 新增模块
    XxxModule,
  ],
  exports: [XxxModule],
})
export class BusinessModule {}
```

## 核心规范

### 六层架构

```
┌─────────────────────────────────────────┐
│  1. Entity (实体层)                    │  ← 数据库映射
├─────────────────────────────────────────┤
│  2. Constants (常量层)                  │  ← 业务常量、配置
├─────────────────────────────────────────┤
│  3. Types (类型层)                      │  ← TypeScript 类型
├─────────────────────────────────────────┤
│  4. DTO (数据传输层)                    │  ← 输入验证
├─────────────────────────────────────────┤
│  5. Service (服务层)                    │  ← 业务逻辑
├─────────────────────────────────────────┤
│  6. Controller (控制器层)               │  ← HTTP 处理
└─────────────────────────────────────────┘
```

### 命名规范

- **目录**: kebab-case（如 `user-management`）
- **文件**: kebab-case（如 `user.service.ts`）
- **类**: PascalCase（如 `UserService`）
- **常量**: UPPER_SNAKE_CASE + 命名空间（如 `USER_CONSTANTS.PAGINATION.DEFAULT_PAGE`）

### 响应格式

使用 `ResponseHelper` 统一返回格式：

```typescript
import { ResponseHelper } from '@/common/utils/response.helper'

// 成功响应
return ResponseHelper.success(data, '操作成功')

// 分页响应
return ResponseHelper.paginated(list, total, page, limit, '查询成功')

// 错误响应（抛出异常）
throw new NotFoundException('资源不存在')
throw new BadRequestException('参数错误')
```

### 错误处理

```typescript
// ✅ 推荐：使用内置异常
throw new NotFoundException('用户不存在')
throw new BadRequestException('参数错误')
throw new InternalServerErrorException('服务异常', { cause: error })

// ❌ 避免：返回错误码
return { success: false, code: 404 }
```

### 验证规则

使用 `class-validator` 和 `@nestjs/swagger`：

```typescript
import { IsString, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateXxxDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiPropertyOptional({ description: '状态', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string
}
```

### 认证授权

使用 `@Public` 和 `@AdminOnly` 装饰器：

```typescript
import { Public, AdminOnly } from '@/modules/auth/decorators'

// 公开访问（无需认证）
@Public()
@Get()
async getList() {}

@UseGuards(AdminOnlyGuard)
@AdminOnly()
@Post()
async create() {}
```

## 项目结构参考

```
src/
├── modules/
│   ├── auth/                 # 认证模块
│   │   ├── constants/
│   │   ├── decorators/       # 自定义装饰器 (@Public, @AdminOnly)
│   │   ├── dto/
│   │   ├── guards/          # 守卫 (JwtAuthGuard, AdminOnlyGuard)
│   │   ├── services/
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   ├── user/                 # 用户模块
│   │   ├── constants/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── services/
│   │   ├── types/
│   │   ├── user.controller.ts
│   │   └── user.module.ts
│   ├── nft/                  # NFT 模块
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── services/
│   │   └── nft.module.ts
│   └── business.module.ts   # 模块聚合
├── common/
│   ├── filters/             # 异常过滤器
│   ├── interceptors/       # 拦截器
│   ├── services/            # 公共服务
│   └── utils/               # 工具函数
└── database/
    └── scripts/             # SQL 脚本
```

## 检查清单

- [ ] 数据库表创建完成
- [ ] Entity 字段与数据库一致
- [ ] Constants 包含分页和字段配置
- [ ] Types 定义完整（Public/Internal 类型）
- [ ] DTO 添加 class-validator 验证装饰器
- [ ] DTO 添加 Swagger @ApiProperty / @ApiPropertyOptional 装饰器
- [ ] Response DTO 添加 Swagger @ApiProperty 装饰器
- [ ] Service 使用 ResponseHelper
- [ ] Controller 添加 @ApiTags 和 @ApiOperation 装饰器
- [ ] 需要认证的接口添加 @ApiBearerAuth
- [ ] 正确使用 @Public / @AdminOnly 装饰器
- [ ] Module 正确导出
- [ ] 在 BusinessModule 中注册
- [ ] 运行 lint 检查代码格式
- [ ] 启动服务访问 /api/docs 验证 Swagger 文档

## 参考资料

- [Entity 模板](references/entity-template.md)
- [Constants 模板](references/constants-template.md)
- [Service 模板](references/service-template.md)
- [Controller 模板](references/controller-template.md)
- [六层架构详解](../docs/后端交互设计文档.md)
