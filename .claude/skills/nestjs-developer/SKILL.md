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

### 环境变量配置规范

所有依赖环境变量的 Service，必须在构造器中**集中校验**配置，不得分散读取或单独抛错。

#### 正确模式：统一校验

```typescript
// ✅ 构造器中统一获取并校验，一次性收集所有缺失项
constructor(private readonly configService: ConfigService) {
  this.config = this.getServiceConfig();
}

private getServiceConfig(): ServiceConfig {
  const requiredKeys = ['APP_ID', 'APP_SECRET', 'TOKEN'];

  const missing = requiredKeys.filter(
    (key) => !this.configService.get<string>(key),
  );

  if (missing.length > 0) {
    this.logger.error(`[服务名] 配置缺失: ${missing.join(', ')}`);
    throw new InternalServerErrorException('服务配置不完整');
  }

  return {
    appId: this.configService.get<string>('APP_ID')!,
    appSecret: this.configService.get<string>('APP_SECRET')!,
    token: this.configService.get<string>('TOKEN')!,
  };
}
```

#### 错误模式（避免）

```typescript
// ❌ 分散读取 + ?? '' 兜底，缺失时静默为空，后续报错不明确
this.appId = this.configService.get<string>('APP_ID') ?? '';

// ❌ 在单独方法中用原生 Error 抛错，类型不一致，日志缺失
private initKey() {
  if (!key) throw new Error('KEY 未配置'); // 抛出原生 Error
}

// ❌ 逐个单独校验，缺失一项就抛错，信息不完整
if (!this.configService.get('APP_ID')) {
  throw new InternalServerErrorException('APP_ID 未配置');
}
if (!this.configService.get('APP_SECRET')) {
  throw new InternalServerErrorException('APP_SECRET 未配置');
}
```

#### 关键要点

| 要求 | 说明 |
|------|------|
| 集中校验 | 在一个 `getXxxConfig()` 方法中统一校验所有必填配置 |
| 一次性报错 | 缺失多个配置时，一次性列出所有缺失项 |
| 日志记录 | 抛异常前使用 `loggingService.error` 记录具体缺失的 key |
| 异常类型 | 使用 `InternalServerErrorException`，不抛出原生 `Error` |
| 非空断言 | 校验通过后使用 `!` 非空断言获取值，确保类型安全 |
| 不可变赋值 | 校验后的配置赋值给 `readonly` 字段，构造器外不可修改 |

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

## 高级设计规范

### 并发安全

在高并发场景下（如支付回调、订单创建），必须考虑并发安全问题：

#### 1. 使用分布式锁

使用 `RedisLockService` 确保同一操作在分布式环境下只执行一次：

```typescript
import { RedisLockService } from '@/common/services/redis-lock.service';

constructor(
  private readonly redisLockService: RedisLockService,
) {}

// 订单创建场景
async createOrder(userId: number, dto: CreateOrderDto) {
  const lockKey = `order:create:${userId}:${dto.goodsId}`;
  return await this.redisLockService.withLock(lockKey, async () => {
    // 业务逻辑
    return await this.processOrder(userId, dto);
  }, 60000); // 60秒超时
}

// 支付回调场景
async handleNotify(params: any) {
  const lockKey = `order:notify:${params.outTradeNo}`;
  return await this.redisLockService.withLock(lockKey, async () => {
    // 回调处理逻辑
    return await this.processCallback(params);
  }, 30000); // 30秒超时
}
```

#### 2. 数据库事务

涉及多个表操作时必须使用事务：

```typescript
import { DataSource } from 'typeorm';

constructor(private readonly dataSource: DataSource) {}

async createOrderWithTransaction(dto: CreateOrderDto) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 创建订单
    const order = queryRunner.manager.create(Order, { ... });
    await queryRunner.manager.save(order);

    // 创建关联记录
    const detail = queryRunner.manager.create(OrderDetail, { ... });
    await queryRunner.manager.save(detail);

    await queryRunner.commitTransaction();
    return order;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

#### 3. 悲观锁

查询需要更新的数据时使用悲观锁：

```typescript
// 使用 FOR UPDATE 锁定行
const order = await queryRunner.manager.findOne(Order, {
  where: { outTradeNo },
  lock: { mode: 'pessimistic_write' },
});
```

### 幂等性设计

支付等关键业务必须保证幂等性，防止重复操作：

#### 1. 回调处理幂等性

```typescript
async handlePaymentCallback(params: PaymentCallbackParams) {
  const lockKey = `pay:notify:${params.outTradeNo}`;

  return await this.redisLockService.withLock(lockKey, async () => {
    // 检查订单是否已处理
    const existingOrder = await this.orderRepository.findOne({
      where: { outTradeNo: params.outTradeNo },
    });

    // 已成功处理的订单，直接返回成功
    if (existingOrder?.tradeState === TRADE_STATE.SUCCESS) {
      return { success: true, message: '订单已处理' };
    }

    // 更新订单状态
    await this.orderRepository.update(
      { outTradeNo: params.outTradeNo },
      { tradeState: TRADE_STATE.SUCCESS, ... }
    );

    return { success: true };
  }, 30000);
}
```

#### 2. 订单创建幂等性

```typescript
async createOrder(dto: CreateOrderDto) {
  // 生成唯一订单号
  const outTradeNo = ICrypto.generateRandomString(32);
  const lockKey = `order:create:${outTradeNo}`;

  return await this.redisLockService.withLock(lockKey, async () => {
    // 检查是否已存在
    const existing = await this.orderRepository.findOne({ where: { outTradeNo } });
    if (existing) {
      throw new BadRequestException('订单已存在，请勿重复创建');
    }

    // 创建订单
    const order = this.orderRepository.create({ outTradeNo, ... });
    return await this.orderRepository.save(order);
  }, 60000);
}
```

### 日志规范

关键操作必须记录结构化日志，包含业务追踪字段：

```typescript
// ✅ 推荐：包含业务追踪字段
this.loggingService.log(
  `[支付回调] 收到通知 - outTradeNo: ${outTradeNo}, tradeState: ${tradeState}`,
);

// ❌ 避免：缺少业务追踪字段
this.logger.log('处理回调');
```

### 常量命名规范

使用命名空间组织相关常量：

```typescript
// ✅ 推荐：命名空间组织
export const PAY_CONSTANTS = {
  CHANNEL: {
    ALIPAY: 'alipay',
    WECHAT: 'wechat',
  },
  STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
  },
  LOCK_KEYS: {
    ORDER_CREATE: 'pay:order:create:',
    ORDER_NOTIFY: 'pay:order:notify:',
  },
} as const;

// ❌ 避免：平铺常量
export const PAY_CHANNEL = 'alipay';
export const PAY_STATUS = 'pending';
```

### 注释规范

所有 Service、工具类等公共方法必须使用 **JSDoc 风格注释**，包含以下要素：

#### 必填要素

| 标签 | 说明 | 示例 |
|------|------|------|
| `@description` | 方法功能描述 | `@description 生成指定长度的唯一随机字符串` |
| `@param` | 参数说明（包含类型） | `@param {number} length 字符串长度` |
| `@returns` | 返回值说明 | `@returns {string} 生成的唯一随机字符串` |
| `@example` | 使用示例（可选但推荐） | `@example ICrypto.generateRandomString(16)` |

#### 注释模板

```typescript
/**
 * @description 方法功能描述
 * @param {参数类型} paramName 参数说明
 * @param {参数类型} [optionalParam] 可选参数说明（带默认值）
 * @returns {返回值类型} 返回值说明
 * @example
 * const result = ClassName.methodName(arg1, arg2)
 */
static methodName(paramName: ParamType, optionalParam: ParamType = defaultValue): ReturnType {
  // implementation
}
```

#### 完整示例（参考 ICrypto）

```typescript
/**
 * @description 生成指定长度的唯一随机字符串
 * @param {number} length 字符串长度，默认为16
 * @returns {string} 生成的唯一随机字符串
 */
static generateRandomString(length: number = 16): string {
  // implementation
}

/**
 * @description 创建 Hmac 签名
 * @param {string | Buffer} data 要签名的数据
 * @param {string} key 密钥
 * @param {HashAlgorithm} algorithm 哈希算法
 * @param {CryptoEncoding} encoding 输出编码格式
 * @returns {string} 生成的签名
 * @example
 * const signature = ICrypto.createHmac(signatureOrigin, secret, HASH_ALGORITHMS.SHA256, ENCODINGS.BASE64)
 */
static createHmac(
  data: string | Buffer,
  key: string,
  algorithm: HashAlgorithm = HASH_ALGORITHMS.SHA256,
  encoding: CryptoEncoding = ENCODINGS.BASE64,
): string {
  // implementation
}
```

#### 注意事项

- `@param` 参数名必须与方法签名一致
- 可选参数使用 `[paramName]` 标记，或在说明中标注"可选"
- 带默认值的参数应说明默认值
- `@example` 中的示例代码应可直接运行
- 类前也需要添加 JSDoc 注释说明类的用途

## 参考资料

- [Entity 模板](references/entity-template.md)
- [Constants 模板](references/constants-template.md)
- [Service 模板](references/service-template.md)
- [Controller 模板](references/controller-template.md)
- [六层架构详解](../docs/后端交互设计文档.md)
