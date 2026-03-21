# API 对接规范

> 前后端接口规范化文档

---

## 零、Swagger 文档

项目已集成 Swagger UI，所有接口文档自动生成：

- **文档地址**: `http://localhost:12600/api/docs`
- **JSON 格式**: `http://localhost:12600/api/docs-json`

Swagger 文档包含：
- 接口路径、请求参数、响应格式
- JWT 认证支持（在页面顶部 Authorize 按钮填入 Token）
- Request/Response 示例
- enum 字段下拉选项



## 一、接口设计原则

### 1.1 RESTful 风格

| HTTP 方法 | 用途 | 示例 |
|-----------|------|------|
| GET | 查询资源 | `GET /api/users` |
| POST | 创建资源 | `POST /api/users` |
| PUT | 完整更新 | `PUT /api/users/:id` |
| PATCH | 部分更新 | `PATCH /api/users/:id` |
| DELETE | 删除资源 | `DELETE /api/users/:id` |

### 1.2 URL 命名规范

```typescript
// 资源命名
/api/users          // 用户列表
/api/nft-types      // NFT类型列表

// 嵌套资源
/api/users/:id/nfts // 用户的NFT列表

// 动作命名
/api/auth/login    // 登录
/api/auth/logout   // 登出
```

---

## 二、请求规范

### 2.1 请求头

```typescript
// 必要请求头
Content-Type: application/json
Authorization: Bearer <token>  // 需要认证的接口
```

### 2.2 查询参数

```typescript
// 分页参数
GET /api/users?page=1&limit=10

// 筛选参数
GET /api/users?status=active&name=张三

// 排序参数
GET /api/users?sort=createdAt&order=desc
```

### 2.3 请求体

```typescript
// 创建资源
POST /api/users
{
  "username": "zhangsan",
  "phone": "13800138000",
  "email": "test@example.com"
}

// 更新资源
PUT /api/users/:id
{
  "nickname": "新昵称"
}
```

---

## 三、响应规范

### 3.1 统一响应格式

项目使用全局拦截器自动包装响应：

```typescript
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 实际数据
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### 3.2 成功响应

```typescript
// 单条数据
{
  "success": true,
  "message": "用户查询成功",
  "data": {
    "id": "uuid",
    "username": "zhangsan",
    "nickname": "张三"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/1"
}

// 分页数据
{
  "success": true,
  "message": "查询成功",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}

// 列表数据
{
  "success": true,
  "message": "查询成功",
  "data": [...],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### 3.3 错误响应

```typescript
// 400 - 参数错误
{
  "success": false,
  "message": "NFT名称不能为空",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/nft"
}

// 401 - 未认证
{
  "success": false,
  "message": "未登录或Token已过期",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/user/info"
}

// 403 - 无权限
{
  "success": false,
  "message": "无权访问该资源",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/admin/users"
}

// 404 - 资源不存在
{
  "success": false,
  "message": "用户不存在",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users/999"
}

// 500 - 服务器错误
{
  "success": false,
  "message": "服务器内部错误",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

---

## 四、认证授权

### 4.1 JWT Token

```typescript
// 登录成功后返回
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 7200
  }
}
```

### 4.2 公共接口

使用 `@Public` 装饰器标记公开接口：

```typescript
import { Public } from '@/modules/auth/decorators'
import { ApiTags, ApiOperation } from '@nestjs/swagger'

@ApiTags('认证模块')
@Controller('api/auth')
export class AuthController {
  @Public()
  @ApiOperation({ summary: '用户登录' })
  @Post('login')
  async login() {}
}
```

### 4.3 需要管理员权限

使用 `@AdminOnly` 装饰器标记管理员接口：

```typescript
import { AdminOnly } from '@/modules/auth/decorators'
import { AdminOnlyGuard } from '@/modules/auth/guards/admin-only.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('NFT类型')
@Controller('api/nft')
export class NftTypesController {
  @UseGuards(AdminOnlyGuard)
  @AdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建NFT类型' })
  @Post()
  async create() {}
}
```

---

## 五、状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 六、前端对接示例

### 6.1 Vue 3 请求封装

```typescript
// utils/request.ts
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // 跳转登录
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default request
```

### 6.2 接口调用

```typescript
// api/user.ts
import request from '@/utils/request'
import type { ApiResponse, PageData } from '@/types'

export const userApi = {
  getList: (params: any) => 
    request.get<ApiResponse<PageData>>('/api/users', { params }),
  
  getById: (id: number) => 
    request.get<ApiResponse>(`/api/users/${id}`),
  
  create: (data: any) => 
    request.post<ApiResponse>('/api/users', data),
  
  update: (id: number, data: any) => 
    request.put<ApiResponse>(`/api/users/${id}`, data),
  
  delete: (id: number) => 
    request.delete<ApiResponse>(`/api/users/${id}`)
}
```

