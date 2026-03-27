# 项目开发规范

> NestJS + TypeORM + MySQL 后端服务项目

> 📌 **注意**: 本项目使用分层嵌套 AGENTS.md 实现动态规则管理。详细规则配置请参考各目录下的 AGENTS.md 文件。

## 🏗️ 规范体系架构

```
根目录/
├── AGENTS.md                          # L0: Skills 系统（全局能力）
│
.claude/rules/
├── AGENTS.md                          # L1: 全局规则入口（跨领域规则）
│   ├── other/api.md                   # API 对接规范（软连接）
│   ├── other/security.md              # 安全规范（软连接）
│   ├── other/testing.md               # 测试规范（软连接）
│   └── backend/code-style.md          # 后端代码风格（软连接）
│
└── frontend/                          # 前端规则（当前项目无前端）
    ├── AGENTS.md
    └── ...
```

**分层原则**：
- **L0**: 全局 Skills 系统，提供专业能力扩展
- **L1**: 全局规则，适用于所有代码（API、安全、测试、后端），通过软连接引用
- **无 L2**: 当前项目为纯后端项目，不涉及前端规则

**软连接机制**：
- 规则文件存储在 `.claude/rules/` 目录下
- AGENTS.md 通过 `<path>` 标签软连接引用规则文件
- 实现规则与配置的分离，便于维护和管理

## 🎯 核心规范（必读）

### 代码风格

- **文件命名**: PascalCase（类、接口、类型）、camelCase（变量、函数）、kebab-case（目录）
- **类型定义**: 避免 any，使用完整 TypeScript 类型，优先使用 interface
- **注释规范**: 所有方法和类添加中文注释，控制器方法添加 JSDoc

### 模块架构

```
标准 NestJS 模块 = Constants + DTO + Entity + Service + Controller + Module
                  (常量层)   (数据传输)  (实体)   (业务逻辑) (请求处理) (模块注册)
```

### 项目模块结构

```
src/
├── modules/                    # 业务模块目录
│   ├── auth/                  # 认证模块
│   │   ├── constants/         # 常量定义
│   │   ├── decorators/        # 自定义装饰器
│   │   ├── dto/              # 数据传输对象
│   │   ├── guards/           # 守卫
│   │   ├── services/         # 业务服务
│   │   ├── auth.controller.ts # 控制器
│   │   └── auth.module.ts    # 模块定义
│   ├── user/                  # 用户模块
│   ├── nft/                   # NFT 业务模块
│   └── business.module.ts    # 业务模块聚合
├── common/                    # 公共模块
│   ├── filters/              # 异常过滤器
│   ├── interceptors/         # 拦截器
│   ├── services/            # 公共服务
│   └── utils/                # 工具函数
├── database/                  # 数据库脚本
└── main.ts                    # 应用入口
```

## 🚀 快速开始

### 1. 新建业务模块（5 步完成）

```typescript
// Step 1: 创建常量 - src/modules/xxx/constants/xxx.constants.ts
export const XXX_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  }
}

// Step 2: 创建 DTO - src/modules/xxx/dto/create-xxx.dto.ts
import { IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateXxxDto {
  @ApiProperty({ description: '名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string
}

// Step 3: 创建实体 - src/modules/xxx/entities/xxx.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('xxx')
export class XxxEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 100 })
  name: string
}

// Step 4: 创建服务 - src/modules/xxx/services/xxx.service.ts
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { XxxEntity } from '../entities/xxx.entity'
import { ResponseHelper } from '@/common/utils/response.helper'

@Injectable()
export class XxxService {
  constructor(
    @InjectRepository(XxxEntity)
    private readonly xxxRepository: Repository<XxxEntity>,
  ) {}

  async getList(page: number, limit: number) {
    const [list, total] = await this.xxxRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit
    })
    return ResponseHelper.paginated(list, total, page, limit)
  }
}

// Step 5: 创建控制器 - src/modules/xxx/xxx.controller.ts
import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common'
import { XxxService } from './services/xxx.service'
import { CreateXxxDto } from './dto/create-xxx.dto'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('XXX管理')
@Controller('api/xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  @ApiOperation({ summary: '获取XXX列表' })
  @Get()
  async getList(
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return await this.xxxService.getList(page, limit)
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建XXX' })
  @Post()
  async create(@Body() createDto: CreateXxxDto) {
    return await this.xxxService.create(createDto)
  }
}
```

### 2. 注册模块

```typescript
// src/modules/business.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { XxxModule } from './xxx/xxx.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([/* 实体 */]),
    XxxModule
  ],
  controllers: [],
  providers: [],
})
export class BusinessModule {}
```

## 🔌 核心组件规范

### 响应格式化

```typescript
import { ResponseHelper } from '@/common/utils/response.helper'

// 成功响应
return ResponseHelper.success(data, '操作成功')

// 分页响应
return ResponseHelper.paginated(list, total, page, limit, '查询成功')

// 错误响应
return ResponseHelper.error('错误信息', { code: 'ERROR_CODE' })
```

### 统一响应格式

项目已配置全局响应拦截器，所有接口自动包装为标准格式：
```typescript
// 接口返回格式
{
  success: true,
  message: '操作成功',
  data: { /* 实际数据 */ },
  timestamp: '2024-01-01T00:00:00.000Z',
  path: '/api/users'
}
```

### 常用装饰器

```typescript
// 路由装饰器
@Controller('api/users')    // 路由前缀
@Get()                      // GET 请求
@Post()                     // POST 请求
@Put(':id')                // PUT 请求（带参数）
@Delete(':id')             // DELETE 请求

// 参数装饰器
@Body()                    // 请求体
@Param('id', ParseUUIDPipe) // URL 参数
@Query('page', ParseIntPipe) // 查询参数

// Swagger 装饰器
@ApiTags('用户管理')        // 接口分组
@ApiOperation({ summary })  // 接口摘要
@ApiBearerAuth('JWT-auth')  // JWT 认证（加在方法上）
@ApiQuery({ name })         // Query 参数说明

// 认证授权装饰器
@UseGuards(JwtAuthGuard)   // JWT 认证
@UseGuards(AdminOnlyGuard) // 管理员权限
@Public()                  // 公开访问（无需认证）
@AdminOnly()               // 管理员专属
```

## 📦 核心模块

| 模块 | 用途 | 位置 |
|------|------|------|
| AuthModule | 用户认证、JWT、短信验证码 | `modules/auth/` |
| UserModule | 用户管理 CRUD | `modules/user/` |
| NftModule | NFT 类型和实例管理 | `modules/nft/` |
| ResponseHelper | 统一响应格式化 | `common/utils/response.helper` |
| HttpExceptionFilter | 统一异常处理 | `common/filters/http-exception.filter` |

### AuthModule 结构

```
auth/
├── constants/              # 认证常量
│   ├── index.ts   # JWT 配置常量
│   └── index.ts
├── decorators/             # 自定义装饰器
│   └── index.ts
├── dto/                   # DTO
│   ├── login.dto.ts        # 登录 DTO
│   └── send-verificationcode.dto.ts  # 短信验证码 DTO
├── guards/                # 守卫
│   ├── jwt.guard.ts       # JWT 认证守卫
│   └── admin-only.guard.ts # 管理员权限守卫
├── services/              # 服务
│   ├── auth.service.ts    # 认证服务
│   └── tencent-sms.service.ts # 腾讯云短信服务
├── auth.controller.ts     # 控制器
└── auth.module.ts         # 模块定义
```

### UserModule 结构

```
user/
├── constants/              # 用户常量
│   ├── index.ts
│   └── user.constants.ts  # 分页、字段选择配置
├── dto/                   # DTO
│   ├── index.ts
│   └── update-user.dto.ts # 更新用户 DTO
├── entities/              # 实体
│   └── user.entity.ts    # 用户实体
├── services/              # 服务
│   ├── user.service.ts   # 用户服务
│   └── encryption.service.ts # 手机号加密服务
├── types/                # 类型定义
│   └── user.types.ts    # 公共/内部用户类型
├── user.controller.ts   # 控制器
└── user.module.ts        # 模块定义
```

### NftModule 结构

```
nft/
├── constants/              # NFT 常量
│   ├── index.ts
│   └── nft.constants.ts
├── controllers/            # 控制器
│   ├── nft-instances.controller.ts
│   └── nft-types.controller.ts
├── dto/                    # DTO
│   ├── create-nft.dto.ts
│   ├── create-nft-instance.dto.ts
│   ├── nft-instance-response.dto.ts
│   ├── nft-response.dto.ts
│   ├── query-nft-instances.dto.ts
│   └── query-nft-types.dto.ts
├── entities/               # 实体
│   ├── nft.entity.ts      # NFT 类型实体
│   └── nft-instance.entity.ts  # NFT 实例实体
├── services/               # 服务
│   ├── nft-instances.service.ts
│   └── nft-types.service.ts
└── nft.module.ts          # 模块定义
```

## 💡 开发建议

### 使用 TypeORM QueryBuilder

```typescript
// ✅ 推荐：使用 QueryBuilder 进行复杂查询
const queryBuilder = this.nftTypeRepository.createQueryBuilder('nft')

if (name) {
  queryBuilder.andWhere('nft.name LIKE :name', { name: `%${name}%` })
}

const [list, total] = await queryBuilder
  .orderBy('nft.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount()

// ❌ 避免：直接拼接 SQL 字符串
const sql = `SELECT * FROM nft WHERE name LIKE '%${name}%'`
```

### 使用 DTO 进行验证

```typescript
// ✅ 推荐：使用 class-validator + @nestjs/swagger
import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @MinLength(2)
  username: string

  @ApiPropertyOptional({ description: '邮箱' })
  @IsEmail()
  email?: string
}

// ❌ 避免：手动验证
if (!username || username.length < 2) {
  throw new BadRequestException('用户名至少2个字符')
}
```

### 统一返回格式

```typescript
// ✅ 使用 ResponseHelper
async getUserList(page: number, limit: number) {
  const [list, total] = await this.userRepository.findAndCount({...})
  return ResponseHelper.paginated(list, total, page, limit, '查询成功')
}

// ❌ 避免：直接返回实体
return users
```

### 异常处理

```typescript
// ✅ 推荐：使用内置异常
throw new NotFoundException('用户不存在')
throw new BadRequestException('参数错误')
throw new InternalServerErrorException('服务异常', { cause: error })

// ❌ 避免：返回错误码
return { success: false, code: 404 }
```

### 认证授权装饰器

```typescript
import { Public, AdminOnly } from '@/modules/auth/decorators'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('认证模块')
@Controller('api/auth')
export class AuthController {
  // 公开接口
  @Public()
  @ApiOperation({ summary: '用户登录' })
  @Post('login')
  async login() {}

  // 需认证接口
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取用户信息' })
  async getInfo() {}

  // 管理员接口
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户' })
  async delete() {}
}
```

## 📋 详细规范

- **代码风格**: `.claude/rules/backend/code-style.md`（含 Swagger 规范）
- **API 规范**: `.claude/rules/other/api.md`
- **安全规范**: `.claude/rules/other/security.md`
- **测试规范**: `.claude/rules/other/testing.md`
- **Swagger 文档**: `http://localhost:12600/api/docs`

## ⚡ 开发检查清单

- [ ] TypeScript 类型定义完整
- [ ] DTO 添加 class-validator 验证装饰器
- [ ] DTO 添加 Swagger @ApiProperty / @ApiPropertyOptional 装饰器
- [ ] Response DTO 添加 Swagger @ApiProperty 装饰器
- [ ] Controller 添加 @ApiTags 和 @ApiOperation 装饰器
- [ ] 需要认证的接口添加 @ApiBearerAuth
- [ ] Service 添加中文注释
- [ ] 正确使用 @Public / @AdminOnly 装饰器
- [ ] 使用 ResponseHelper 返回响应
- [ ] 正确处理异常
- [ ] 使用 UUID 主键
- [ ] 使用软删除（isActive 字段）
- [ ] 模块正确导出依赖
- [ ] 在 BusinessModule 中注册新模块
- [ ] 启动服务访问 /api/docs 验证 Swagger 文档

---

**核心理念**: 清晰架构、规范开发、类型安全、易于维护

**规范体系**: 基于 AGENTS.md 的统一规范标准，Rules 和 Skills 协同工作
