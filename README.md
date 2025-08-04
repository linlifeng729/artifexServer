# Artifex Server

基于 NestJS 的后端API服务，提供用户认证和管理功能。

## 📋 项目概述

这是一个使用 NestJS 框架构建的现代化后端服务，集成了JWT认证、数据验证、配置管理等核心功能。

## 🚀 技术栈

- **框架**: NestJS 11.x
- **语言**: TypeScript
- **认证**: JWT (JSON Web Token)
- **验证**: Class-validator & Class-transformer
- **部署**: PM2
- **测试**: Jest

## 📦 项目结构

```
artifex-server/
├── src/
│   ├── auth/              # 认证服务
│   │   └── auth.service.ts
│   ├── config/            # 配置文件
│   ├── dto/               # 数据传输对象
│   │   └── login.dto.ts
│   ├── entities/          # 实体类
│   ├── examples/          # 示例代码
│   ├── prisma/            # 数据库相关
│   ├── repositories/      # 数据仓库
│   ├── app.controller.ts  # 应用控制器
│   ├── app.module.ts      # 应用模块
│   ├── main.ts           # 应用入口
│   └── user.controller.ts # 用户控制器
├── test/                  # 测试文件
├── ecosystem.config.js    # PM2 配置
└── package.json
```

## 🛠️ 安装与运行

### 前置要求

- Node.js >= 16
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env` 文件并配置以下环境变量：

```env
# 端口配置
PORT=3000

# JWT配置
JWT_SECRET=your-jwt-secret-key

# 其他配置项...
```

### 开发环境运行

```bash
# 开发模式（热重载）
npm run start:dev

# 调试模式
npm run start:debug

# 普通启动
npm run start
```

### 生产环境部署

```bash
# 构建项目
npm run build

# PM2部署（推荐）
npm run start:pm2

# 或直接运行
npm run start:prod
```

## 📚 API 文档

### 基础信息

- **基础URL**: `http://localhost:3000`
- **认证方式**: JWT Bearer Token

### 认证相关

#### 用户登录

```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例:**

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 测试账户

项目提供以下测试账户：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | admin123 | 管理员 |
| user   | user123  | 普通用户 |

## 🧪 测试

```bash
# 单元测试
npm run test

# 监听模式测试
npm run test:watch

# 测试覆盖率
npm run test:cov

# E2E测试
npm run test:e2e
```

## 🔧 开发工具

### 代码格式化

```bash
# 格式化代码
npm run format

# 代码检查
npm run lint
```

### 构建

```bash
# 构建项目
npm run build
```

## 📝 主要功能

### 🔐 认证系统

- JWT Token 认证
- 用户登录验证
- Token 有效期管理（24小时）

### ✅ 数据验证

- 使用 Class-validator 进行请求数据验证
- 全局验证管道配置
- 自动类型转换

### ⚙️ 配置管理

- 支持环境变量配置
- 全局配置服务
- 多环境配置支持

## 🚀 部署说明

### PM2 配置

项目使用 PM2 进行生产环境部署，配置如下：

- **应用名称**: artifexServer
- **实例数量**: 2
- **端口**: 12600
- **内存限制**: 1GB
- **自动重启**: 启用

### 环境要求

- Node.js 16+
- PM2 (生产环境)
- 足够的内存和CPU资源

## 📄 许可证

UNLICENSED

## 👥 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📞 联系方式

如有问题，请访问：[https://linlifeng.top](https://linlifeng.top)

---

**注意**: 当前项目使用模拟数据进行用户认证，生产环境请替换为真实的数据库实现。
