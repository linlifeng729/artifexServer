# NestJS 后端代码风格规范

> 适用于 src/modules/ 目录下的所有业务模块代码

---

## 一、架构规范

### 1.1 六层架构

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

### 1.2 模块目录结构

```
modules/xxx/
├── constants/              # 常量层
│   ├── index.ts
│   └── xxx.constants.ts
├── dto/                   # DTO 层
│   ├── index.ts
│   ├── create-xxx.dto.ts
│   ├── update-xxx.dto.ts
│   └── query-xxx.dto.ts
├── entities/              # 实体层
│   └── xxx.entity.ts
├── services/             # 服务层
│   ├── xxx.service.ts
│   └── xxx-other.service.ts
├── types/                # 类型层
│   └── xxx.types.ts
├── controllers/           # 控制器层（复杂模块）
│   └── xxx.controller.ts
├── xxx.controller.ts     # 控制器层（简单模块）
└── xxx.module.ts         # 模块定义
```

---

## 二、文件命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| 目录 | kebab-case | `user-management` |
| Entity 文件 | xxx.entity.ts | `user.entity.ts` |
| Constants 文件 | xxx.constants.ts | `user.constants.ts` |
| Types 文件 | xxx.types.ts | `user.types.ts` |
| DTO 文件 | xxx.dto.ts | `create-user.dto.ts` |
| Service 文件 | xxx.service.ts | `user.service.ts` |
| Controller 文件 | xxx.controller.ts | `user.controller.ts` |
| Module 文件 | xxx.module.ts | `user.module.ts` |
| Index 文件 | index.ts | `constants/index.ts` |

---

## 三、类命名规范

| 类型 | 命名规则 | 示例 |
|------|---------|------|
| Entity | PascalCase + Entity | `UserEntity` |
| Constants | UPPER_SNAKE + CONSTANTS | `USER_CONSTANTS` |
| Types | PascalCase | `PublicUser`, `UserPaginatedResult` |
| DTO | PascalCase + Dto | `CreateUserDto`, `QueryUserDto` |
| Service | PascalCase + Service | `UserService` |
| Controller | PascalCase + Controller | `UserController` |
| Module | PascalCase + Module | `UserModule` |

---

## 四、Entity 规范

### 4.1 基础 Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { USER_CONSTANTS } from '@/modules/user/constants'

/**
 * 用户实体
 * 定义用户表的结构和字段
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number

  @Column({ 
    type: 'varchar', 
    length: USER_CONSTANTS.CONSTRAINTS.ID_LENGTH, 
    unique: true, 
    comment: '用户UUID' 
  })
  id: string

  @Column({ 
    length: USER_CONSTANTS.CONSTRAINTS.PHONE_LENGTH, 
    comment: '加密的手机号' 
  })
  phone: string

  @Column({ type: 'tinyint', width: 1, default: 1, comment: '是否激活' })
  isActive: boolean

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date
}
```

### 4.2 主键类型选择

```typescript
// 自增主键（简单场景）
@PrimaryGeneratedColumn()
id: number

// UUID 主键（分布式/安全场景）
@PrimaryGeneratedColumn('uuid')
id: string
```

### 4.3 字段类型映射

| 数据库类型 | TypeORM 装饰器 | TypeScript 类型 |
|----------|---------------|---------------|
| INT | `@Column({ type: 'int' })` | `number` |
| VARCHAR | `@Column({ length: 100 })` | `string` |
| TEXT | `@Column({ type: 'text' })` | `string` |
| TINYINT | `@Column({ type: 'tinyint', width: 1 })` | `boolean` / `number` |
| DATETIME | `@Column({ type: 'datetime' })` | `Date` |
| TIMESTAMP | `@Column({ type: 'timestamp' })` | `Date` |
| ENUM | `@Column({ enum: EnumType })` | `enum` |
| DECIMAL | `@Column({ type: 'decimal', precision: 10, scale: 2 })` | `number` |
| JSON | `@Column({ type: 'json' })` | `object` |

---

## 五、Constants 规范

### 5.1 完整结构

```typescript
/**
 * 用户模块常量定义
 */
export const USER_CONSTANTS = {
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  // 字段选择配置
  SELECT_FIELDS: {
    PUBLIC: ['id', 'username', 'nickname', 'email', 'status', 'createdAt'] as const,
    INTERNAL: ['id', 'username', 'phone', 'email', 'password', 'status'] as const
  },
  
  // 状态枚举
  STATUS: {
    ACTIVE: 1,
    INACTIVE: 0
  },
  
  // 角色枚举
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },
  
  // 字段长度限制
  CONSTRAINTS: {
    ID_LENGTH: 36,
    PHONE_LENGTH: 255,
    NICKNAME_MAX_LENGTH: 50
  }
} as const

// 类型导出
export type UserStatus = typeof USER_CONSTANTS.STATUS[keyof typeof USER_CONSTANTS.STATUS]
export type UserRole = typeof USER_CONSTANTS.ROLES[keyof typeof USER_CONSTANTS.ROLES]

export default USER_CONSTANTS
```

---

## 六、DTO 规范

### 6.1 创建 DTO

```typescript
import { IsString, IsEnum, IsNotEmpty, MaxLength, IsUrl, IsOptional, IsNumber, Min } from 'class-validator'
import {
  NFT_STATUS_VALUES,
  NFT_CONSTRAINTS,
  NftStatus,
} from '@/modules/nft/constants'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 创建NFT的请求DTO
 */
export class CreateNftDto {
  @ApiProperty({ description: 'NFT名称', maxLength: NFT_CONSTRAINTS.NAME_MAX_LENGTH })
  @IsString({ message: 'NFT名称必须是字符串' })
  @IsNotEmpty({ message: 'NFT名称不能为空' })
  @MaxLength(NFT_CONSTRAINTS.NAME_MAX_LENGTH, {
    message: `NFT名称不能超过${NFT_CONSTRAINTS.NAME_MAX_LENGTH}个字符`,
  })
  name: string;

  @ApiProperty({ description: 'NFT图片URL', maxLength: NFT_CONSTRAINTS.IMAGE_URL_MAX_LENGTH })
  @IsString({ message: 'NFT图片URL必须是字符串' })
  @IsNotEmpty({ message: 'NFT图片URL不能为空' })
  @IsUrl({}, { message: 'NFT图片URL格式不正确' })
  image: string;

  @ApiPropertyOptional({ description: 'NFT状态', enum: NFT_STATUS_VALUES })
  @IsOptional()
  @IsEnum(NFT_STATUS_VALUES, {
    message: `NFT状态只能是${NFT_STATUS_VALUES.join('或')}`,
  })
  status?: NftStatus;
}
```

### 6.2 查询 DTO

```typescript
import { Transform } from 'class-transformer'
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { NFT_CONSTANTS } from '@/modules/nft/constants'

/**
 * 查询NFT类型列表 DTO
 */
export class QueryNftTypesDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number

  @ApiPropertyOptional({ description: 'NFT名称模糊搜索' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'NFT状态', enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string
}
```

---

## 七、Service 规范

### 7.1 基础结构

```typescript
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '@/modules/user/entities/user.entity'
import { UpdateUserDto } from '@/modules/user/dto'
import { EncryptionService } from '@/modules/user/services/encryption.service'
import { ApiResponse } from '@/common/interceptors/response.interceptor'
import { ResponseHelper } from '@/common/utils/response.helper'
import { USER_CONSTANTS } from '@/modules/user/constants'
import { PublicUser, UserPaginatedResult } from '@/modules/user/types/user.types'

/**
 * 用户服务
 * 负责用户数据的增删改查操作
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * 根据ID查找用户
   */
  async getUserById(id: string): Promise<ApiResponse<PublicUser | null>> {
    try {
      const user = await this.userRepository.findOne({
        where: { id, isActive: true },
        select: USER_CONSTANTS.SELECT_FIELDS.PUBLIC
      })
      
      if (!user) {
        throw new NotFoundException('用户不存在')
      }
      
      return ResponseHelper.success(user, '用户查询成功')
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      throw new InternalServerErrorException(
        '用户查询失败，请稍后重试',
        { cause: error }
      )
    }
  }

  /**
   * 获取用户列表（分页）
   */
  async getUserList(
    page: number = USER_CONSTANTS.PAGINATION.DEFAULT_PAGE, 
    limit: number = USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT
  ): Promise<ApiResponse<UserPaginatedResult>> {
    const safeLimit = Math.min(limit, USER_CONSTANTS.PAGINATION.MAX_LIMIT)
    
    const [list, total] = await this.userRepository.findAndCount({
      where: { isActive: true },
      select: USER_CONSTANTS.SELECT_FIELDS.PUBLIC,
      skip: (page - 1) * safeLimit,
      take: safeLimit,
      order: { createdAt: 'DESC' }
    })

    return ResponseHelper.paginated(list, total, page, safeLimit, '用户列表查询成功')
  }
}
```

### 7.2 响应格式化

```typescript
import { ResponseHelper } from '@/common/utils/response.helper'

// 成功响应
return ResponseHelper.success(data, '操作成功')

// 分页响应
return ResponseHelper.paginated(list, total, page, limit, '查询成功')

// 错误响应（抛出异常）
throw new NotFoundException('资源不存在')
throw new BadRequestException('参数错误')
throw new InternalServerErrorException('服务异常', { cause: error })
```

---

## 八、Controller 规范

### 8.1 基础结构

```typescript
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe, ParseUUIDPipe,
  HttpCode, DefaultValuePipe, UseGuards,
} from '@nestjs/common'
import { UserService } from '@/modules/user/services/user.service'
import { UpdateUserDto } from '@/modules/user/dto'
import { USER_CONSTANTS } from '@/modules/user/constants'
import { AdminOnly, Public } from '@/modules/auth/decorators'
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard'
import { ApiResponse } from '@/common/interceptors/response.interceptor'
import {
  ApiTags, ApiOperation, ApiQuery, ApiBearerAuth,
} from '@nestjs/swagger'

/**
 * 用户控制器
 * 处理用户管理相关的HTTP请求
 */
@ApiTags('用户管理')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户列表（公开访问）
   *
   * @param page 页码
   * @param limit 每页数量
   */
  @Public()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: '每页数量', required: false, type: Number })
  @Get()
  async getUserList(
    @Query('page', new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_PAGE), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(USER_CONSTANTS.PAGINATION.DEFAULT_LIMIT), ParseIntPipe)
    limit: number,
  ): Promise<ApiResponse<any>> {
    return await this.userService.getUserList(page, limit)
  }

  /**
   * 创建用户（管理员权限）
   *
   * @param createUserDto 创建用户的数据传输对象
   */
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建用户' })
  @Post()
  async createUser(@Body() createUserDto: any): Promise<ApiResponse<any>> {
    return await this.userService.createUser(createUserDto)
  }

  /**
   * 根据ID获取用户信息
   *
   * @param id 用户UUID
   */
  @Public()
  @ApiOperation({ summary: '根据ID获取用户信息' })
  @Get(':id')
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponse<any>> {
    return await this.userService.getUserById(id)
  }

  /**
   * 更新用户信息
   *
   * @param id 用户UUID
   * @param updateUserDto 更新用户信息的数据传输对象
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新用户信息' })
  @Put(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<any>> {
    return await this.userService.updateUser(id, updateUserDto)
  }

  /**
   * 删除用户
   *
   * @param id 用户UUID
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除用户' })
  @Delete(':id')
  @HttpCode(204)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<ApiResponse<any>> {
    return await this.userService.deleteUser(id)
  }
}
```

### 8.2 常用装饰器

```typescript
// 路由装饰器
@Controller('api/users')    // 路由前缀
@Get()                      // GET 请求
@Post()                     // POST 请求
@Put(':id')                // PUT 请求（带参数）
@Delete(':id')             // DELETE 请求
@HttpCode(204)             // 自定义 HTTP 状态码

// 参数装饰器
@Body()                    // 请求体
@Param('id', ParseUUIDPipe) // URL 参数（带类型转换）
@Query('page', ParseIntPipe) // 查询参数
@Headers('authorization')   // 请求头

// 认证授权装饰器
@UseGuards(JwtAuthGuard)   // JWT 认证
@UseGuards(AdminOnlyGuard) // 管理员权限
@Public()                   // 公开访问（无需认证）
@AdminOnly()                // 管理员专属
```

---

## 九、Module 规范

### 9.1 模块定义

```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from '@/modules/user/user.controller'
import { UserService } from '@/modules/user/services/user.service'
import { User } from '@/modules/user/entities/user.entity'
import { EncryptionService } from '@/modules/user/services/encryption.service'

/**
 * 用户模块
 * 包含用户相关的所有功能：控制器、服务、实体等
 */
@Module({
  imports: [
    // 注册用户实体
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UserController],
  providers: [UserService, EncryptionService],
  exports: [UserService, EncryptionService],
})
export class UserModule {}
```

### 9.2 模块注册

在 `src/modules/business.module.ts` 中注册：

```typescript
import { Module } from '@nestjs/common'
import { UserModule } from '@/modules/user/user.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { NftModule } from '@/modules/nft/nft.module'

/**
 * 业务模块聚合模块
 * 用于集中管理所有业务模块，新增模块时在此处添加
 */
@Module({
  imports: [
    UserModule,
    AuthModule,
    NftModule,
  ],
  exports: [
    UserModule,
    AuthModule,
    NftModule,
  ],
})
export class BusinessModule {}
```

---

## 十、Types 规范

### 10.1 类型定义

```typescript
/**
 * 公开用户信息（不含敏感字段）
 */
export interface PublicUser {
  id: string
  username: string
  nickname?: string
  email?: string
  status: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 内部用户信息（包含敏感字段）
 */
export interface InternalUser extends PublicUser {
  phone: string
  password?: string
}

/**
 * 分页结果类型
 */
export interface UserPaginatedResult {
  list: PublicUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 删除结果类型
 */
export interface UserDeleteResult {
  deleted: boolean
}
```

---

## 十一、Swagger API 文档规范

项目使用 `@nestjs/swagger` 自动生成 API 文档，文档地址：`/api/docs`

### 11.1 安装与配置

```typescript
// 安装依赖
npm install @nestjs/swagger

// src/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const swaggerConfig = new DocumentBuilder()
  .setTitle('Artifex API')
  .setDescription('Artifex 后端 API 文档')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: '输入 JWT Token',
      in: 'header',
    },
    'JWT-auth',
  )
  .build()

const document = SwaggerModule.createDocument(app, swaggerConfig)
SwaggerModule.setup('api/docs', app, document)
```

### 11.2 Controller Swagger 装饰器

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger'

@ApiTags('用户管理')            // 接口分组标签
@Controller('api/users')
export class UserController {
  // 公开接口 - 不加 @ApiBearerAuth
  @Public()
  @ApiOperation({ summary: '获取用户列表' })
  @Get()
  async getList() {}

  // 需要认证的接口
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')   // 在需要认证的方法上加
  @ApiOperation({ summary: '更新用户信息' })
  @Put(':id')
  async update() {}

  // 回调通知等特殊接口
  @Public()
  @ApiOperation({ summary: '支付宝支付回调' })
  @SwaggerApiResponse({ status: 200, description: '处理成功' })
  @Post('notify/alipay') {}
}
```

### 11.3 DTO Swagger 装饰器

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateUserDto {
  // 必填字段
  @ApiProperty({ description: '用户名', example: '张三' })
  @IsString()
  name: string

  // 可选字段
  @ApiPropertyOptional({ description: '邮箱', example: 'test@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  // 带枚举示例
  @ApiPropertyOptional({ description: '用户角色', enum: ['user', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string

  // 带长度限制
  @ApiPropertyOptional({ description: '昵称', maxLength: 50 })
  @IsOptional()
  @MaxLength(50)
  nickname?: string
}

// 查询 DTO（用于 @Query 参数）
export class QueryUserDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number = 1

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  limit?: number = 10
}
```

### 11.4 Response DTO Swagger 装饰器

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UserResponseDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  email?: string

  @ApiProperty({ description: '用户角色', enum: ['user', 'admin'] })
  role: string

  // 嵌套对象
  @ApiPropertyOptional({ description: '关联信息' })
  profile?: {
    id: number
    bio?: string
  }
}
```

### 11.5 注意事项

- `@ApiBearerAuth` 必须加在具体方法上，不要加在控制器类上（否则所有接口都会显示需要认证）
- `@ApiResponse` 与项目的 `ApiResponse` 类型重名，必须使用别名 `SwaggerApiResponse`
- 枚举字段使用 `enum:` 属性可以让 Swagger UI 显示下拉选项
- 统一响应格式由全局拦截器自动包装，Swagger 文档展示的是原始数据结构

---

## 十二、检查清单

### 开发前
- [ ] 确认数据库表结构
- [ ] 确认业务需求和字段

### 开发中
- [ ] Entity 字段与数据库一致
- [ ] Constants 包含分页和字段配置
- [ ] Types 定义完整（Public/Internal 类型）
- [ ] DTO 添加 class-validator 验证装饰器
- [ ] DTO 添加 Swagger @ApiProperty 装饰器
- [ ] Service 使用 ResponseHelper 返回响应
- [ ] Controller 添加 JSDoc 注释和 @ApiOperation
- [ ] Controller 正确使用 @Public / @AdminOnly 装饰器
- [ ] 需要认证的接口添加 @ApiBearerAuth

### 开发后
- [ ] Module 正确导出依赖
- [ ] 在 BusinessModule 中注册新模块
- [ ] 运行 lint 检查代码格式
- [ ] 启动服务访问 /api/docs 验证 Swagger 文档

