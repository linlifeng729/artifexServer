# Artifex Server

后端服务系统

## 项目简介

基于 NestJS 框架开发的后端服务。

## 技术栈

- **框架**: NestJS 11.x
- **语言**: TypeScript
- **数据库**: MySQL + TypeORM
- **认证**: JWT (JSON Web Token)
- **密码加密**: bcrypt
- **定时任务**: @nestjs/schedule
- **短信服务**: 腾讯云 SMS
- **部署**: PM2

## 运行环境

### 基础环境要求

| 环境 | 版本要求 | 说明 |
|------|---------|------|
| **Node.js** | >= 20.0.0 | 推荐使用 LTS 版本 |
| **npm** | >= 9.0.0 | 随 Node.js 一起安装 |
| **操作系统** | Windows / macOS / Linux | 支持跨平台运行 |

### 数据库要求

| 数据库 | 版本要求 | 说明 |
|--------|---------|------|
| **MySQL** | >= 5.7 | 推荐使用 MySQL 8.0 以获得更好性能 |
| **字符集** | utf8mb4 | 必须使用 utf8mb4 字符集以支持 emoji |

### 可选服务

| 服务 | 版本 | 说明 |
|------|------|------|
| **Redis** | >= 6.0 | 用于缓存和会话存储（可选） |
| **PM2** | >= 5.0 | 生产环境进程管理（可选） |

### 端口要求

| 端口 | 用途 |
|------|------|
| 12600 | 应用服务主端口 |
| 3306 | MySQL 数据库端口（如本地） |

### 环境检查

运行项目前，请确保已完成以下检查：

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 MySQL 服务是否运行
# Windows
net start mysql

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器（热重载）
npm run start:debug

# 或者使用 watch 模式
npm run start:dev
```

服务将在 `http://localhost:12600` 启动

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `.output` 目录

### 生产环境运行

```bash
# 直接运行
npm run start:prod

# 或使用 PM2 运行
npm run start:pm2
```

## 环境配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=artifex
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# 腾讯云短信配置
TENCENT_SMS_SECRET_ID=your_secret_id
TENCENT_SMS_SECRET_KEY=your_secret_key
TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
TENCENT_SMS_SIGN_NAME=your_sign_name
TENCENT_SMS_TEMPLATE_ID=your_template_id
```

## 注意事项

1. **JWT 令牌有效期**: 默认 24 小时
2. **数据库同步**: `DB_SYNCHRONIZE` 建议在生产环境设为 `false`，使用迁移工具管理数据库结构
3. **端口**: 服务默认监听 `12600` 端口
4. **全局认证**: 除标记 `@Public()` 的接口外，其他接口都需要 JWT 认证
5. **管理员权限**: 部分敏感操作需要管理员权限
