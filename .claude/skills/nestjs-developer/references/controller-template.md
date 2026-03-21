# Controller 模板

## 基础结构

```typescript
// src/modules/xxx/xxx.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe, ParseUUIDPipe,
  HttpCode, DefaultValuePipe, UseGuards,
} from '@nestjs/common'
import { XxxService } from '@/modules/xxx/services/xxx.service'
import { CreateXxxDto, UpdateXxxDto, QueryXxxDto } from '@/modules/xxx/dto'
import { XXX_CONSTANTS } from '@/modules/xxx/constants'
import { Public, AdminOnly } from '@/modules/auth/decorators'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt.guard'
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard'
import { ApiResponse } from '@/common/interceptors/response.interceptor'
import {
  ApiTags, ApiOperation, ApiQuery, ApiBearerAuth,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger'

/**
 * XXX 控制器
 * 处理 XXX 相关的 HTTP 请求
 */
@ApiTags('XXX管理')
@Controller('api/xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  /**
   * 获取 XXX 列表（公开）
   */
  @Public()
  @ApiOperation({ summary: '获取XXX列表' })
  @Get()
  async getXxxList(
    @Query() queryDto: QueryXxxDto,
  ): Promise<ApiResponse<any>> {
    return await this.xxxService.getXxxList(queryDto)
  }

  /**
   * 根据ID获取XXX详情（公开）
   */
  @Public()
  @ApiOperation({ summary: '获取XXX详情' })
  @Get(':id')
  async getXxxById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<any>> {
    return await this.xxxService.getXxxById(id)
  }

  /**
   * 创建 XXX（需登录）
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建XXX' })
  @SwaggerApiResponse({ status: 201, description: '创建成功' })
  @Post()
  async createXxx(
    @Body() createDto: CreateXxxDto,
  ): Promise<ApiResponse<any>> {
    return await this.xxxService.createXxx(createDto)
  }

  /**
   * 更新 XXX（需登录）
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '更新XXX' })
  @Put(':id')
  async updateXxx(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateXxxDto,
  ): Promise<ApiResponse<any>> {
    return await this.xxxService.updateXxx(id, updateDto)
  }

  /**
   * 删除 XXX（需登录）
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '删除XXX' })
  @Delete(':id')
  @HttpCode(204)
  async deleteXxx(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return await this.xxxService.deleteXxx(id)
  }
}
```

## 带 CurrentUser 的控制器

```typescript
// src/modules/xxx/xxx.controller.ts
import { CurrentUser } from '@/modules/auth/decorators'

@ApiTags('XXX管理')
@Controller('api/xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  /**
   * 获取我的 XXX 列表（需登录）
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取我的XXX列表' })
  @Get('my')
  async getMyXxxList(
    @CurrentUser('userId') userId: number,
    @Query() queryDto: QueryXxxDto,
  ): Promise<ApiResponse<any>> {
    return await this.xxxService.getMyXxxList(userId, queryDto)
  }
}
```

## 带 AdminOnly 的控制器

```typescript
// src/modules/xxx/xxx.controller.ts

@ApiTags('XXX管理')
@Controller('api/xxx')
export class XxxController {
  constructor(private readonly xxxService: XxxService) {}

  /**
   * 创建 XXX（仅管理员）
   */
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建XXX（管理员）' })
  @Post()
  async createXxx(@Body() createDto: CreateXxxDto): Promise<ApiResponse<any>> {
    return await this.xxxService.createXxx(createDto)
  }
}
```

## Query 参数接收方式

### 方式一：DTO 封装（推荐）

```typescript
// 使用 DTO 封装查询参数
@Get()
@ApiOperation({ summary: '获取列表' })
async getList(@Query() queryDto: QueryXxxDto) {
  return await this.xxxService.getXxxList(queryDto)
}
```

### 方式二：直接参数

```typescript
// 直接接收单个参数
@Get()
@ApiOperation({ summary: '获取列表' })
@ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
@ApiQuery({ name: 'limit', description: '每页数量', required: false, type: Number })
async getList(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
) {
  return await this.xxxService.getXxxList(page, limit)
}
```

## Swagger 装饰器说明

| 装饰器 | 位置 | 说明 |
|--------|------|------|
| `@ApiTags('分组名')` | Controller 类 | 接口在文档中的分组 |
| `@ApiOperation({ summary })` | 方法 | 接口摘要说明 |
| `@ApiQuery({ name, description })` | 方法 | Query 参数说明 |
| `@ApiBearerAuth('JWT-auth')` | 方法 | 标记需要 JWT 认证（不要加在类上） |
| `@SwaggerApiResponse({ status })` | 方法 | 响应状态码说明 |

**注意**: `@ApiBearerAuth` 必须加在**具体方法**上，不要加在控制器类上，否则所有接口都会显示需要认证。
