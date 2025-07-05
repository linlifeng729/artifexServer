# NestJS 应用

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

<p align="center">一个基于 <a href="http://nodejs.org" target="_blank">Node.js</a> 的渐进式框架，用于构建高效且可扩展的服务器端应用程序。</p>
<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
<a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
<a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
<a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

## 📋 目录

- [项目描述](#项目描述)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [项目安装](#项目安装)
- [项目运行](#项目运行)
- [API 文档](#api-文档)
- [项目构建](#项目构建)
- [代码格式化](#代码格式化)
- [测试](#测试)
- [环境配置](#环境配置)
- [项目结构](#项目结构)
- [部署](#部署)
- [开发工具](#开发工具)
- [故障排除](#故障排除)
- [相关资源](#相关资源)
- [许可证](#许可证)

## 项目描述

这是一个基于 [NestJS](https://github.com/nestjs/nest) 框架的 TypeScript 启动项目，提供了以下功能：

- **配置管理**: 使用 `@nestjs/config` 进行环境配置管理
- **用户管理**: 包含用户相关的 API 接口
- **PM2 部署**: 支持使用 PM2 进行生产环境部署
- **代码质量**: 集成 ESLint 和 Prettier 进行代码格式化
- **测试支持**: 支持单元测试和端到端测试

## 功能特性

- ✅ NestJS 11.x 框架
- ✅ TypeScript 支持
- ✅ 环境配置管理
- ✅ 用户控制器
- ✅ PM2 部署配置
- ✅ ESLint + Prettier 代码格式化
- ✅ Jest 测试框架
- ✅ 热重载开发模式
- ✅ 内存监控和自动重启
- ✅ 多实例负载均衡

## 快速开始

### 1. 克隆项目
```bash
git clone <your-repository-url>
cd nest-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
# PORT=5000
```

### 4. 启动开发服务器
```bash
npm run start:dev
```

### 5. 访问应用
打开浏览器访问 `http://localhost:5000`

## 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- PM2 (可选，用于生产部署)

## 项目安装

```bash
# 安装依赖
$ npm install

# 安装 PM2 (可选)
$ npm install -g pm2
```

## 项目运行

```bash
# 开发模式 (推荐)
$ npm run start:dev

# 生产模式
$ npm run start:prod

# 使用 PM2 启动
$ npm run start:pm2

# 调试模式
$ npm run start:debug

# 普通启动
$ npm run start
```

## API 文档

### 基础端点

| 方法 | 路径 | 描述 | 响应 |
|------|------|------|------|
| GET | `/` | 获取欢迎信息 | `Hello World!` |
| GET | `/api/user` | 获取用户信息 | `{ message: "Hello, this is the user endpoint!" }` |

### 示例请求

```bash
# 获取欢迎信息
curl http://localhost:5000/

# 获取用户信息
curl http://localhost:5000/api/user
```

### 响应格式

所有 API 响应都采用 JSON 格式：

```json
{
  "message": "响应内容"
}
```

## 项目构建

```bash
# 构建项目
$ npm run build

# 构建并复制必要文件
$ npm run copy
```

## 代码格式化

```bash
# 格式化代码
$ npm run format

# 代码检查
$ npm run lint

# 代码检查并自动修复
$ npm run lint:fix
```

## 测试

```bash
# 单元测试
$ npm run test

# 监听模式测试
$ npm run test:watch

# 端到端测试
$ npm run test:e2e

# 测试覆盖率
$ npm run test:cov

# 调试测试
$ npm run test:debug
```

## 环境配置

项目使用 `.env` 文件进行环境配置，主要配置项：

```env
# 服务端口号 (默认: 5000)
PORT=5000

# 环境模式 (development/production)
NODE_ENV=development

# 其他配置项...
```

### 环境变量说明

- `PORT`: 服务端口号，默认为 5000
- `NODE_ENV`: 环境模式，影响日志级别和性能优化

## 项目结构

```
nest-app/
├── src/                    # 源代码目录
│   ├── app.controller.ts   # 主控制器
│   ├── app.service.ts      # 主服务
│   ├── app.module.ts       # 主模块
│   ├── user.controller.ts  # 用户控制器
│   └── main.ts            # 应用入口
├── test/                   # 测试文件
├── dist/                   # 构建输出目录
├── .env                    # 环境变量文件
├── ecosystem.config.js     # PM2 配置文件
├── package.json           # 项目配置
└── README.md              # 项目文档
```

## 部署

### 使用 PM2 部署 (推荐)

项目已配置 PM2 部署，支持多实例和自动重启：

```bash
# 启动 PM2 服务
$ npm run start:pm2

# 查看 PM2 状态
$ pm2 status

# 查看日志
$ pm2 logs artifexServer

# 重启服务
$ pm2 restart artifexServer

# 停止服务
$ pm2 stop artifexServer
```

### PM2 配置说明

- **应用名称**: `artifexServer`
- **实例数量**: 2 个
- **内存限制**: 1GB
- **端口**: 12600 (生产环境)
- **自动重启**: 启用

### 传统部署

```bash
# 构建项目
$ npm run build

# 启动生产服务
$ npm run start:prod
```

### Docker 部署 (可选)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 5000

CMD ["node", "dist/main"]
```

## 开发工具

- **NestJS CLI**: 用于生成代码和项目管理
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Jest**: 测试框架
- **PM2**: 进程管理和部署工具

### 常用 NestJS CLI 命令

```bash
# 生成控制器
$ nest generate controller users

# 生成服务
$ nest generate service users

# 生成模块
$ nest generate module users

# 生成完整的 CRUD 资源
$ nest generate resource users
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   netstat -ano | findstr :5000
   
   # 修改端口号
   # 在 .env 文件中设置 PORT=其他端口
   ```

2. **PM2 启动失败**
   ```bash
   # 检查 PM2 配置
   pm2 list
   
   # 删除旧进程
   pm2 delete artifexServer
   
   # 重新启动
   npm run start:pm2
   ```

3. **依赖安装失败**
   ```bash
   # 清除缓存
   npm cache clean --force
   
   # 删除 node_modules
   rm -rf node_modules package-lock.json
   
   # 重新安装
   npm install
   ```

4. **TypeScript 编译错误**
   ```bash
   # 检查 TypeScript 配置
   npx tsc --noEmit
   
   # 重新构建
   npm run build
   ```

### 日志查看

```bash
# 开发模式日志
npm run start:dev

# PM2 日志
pm2 logs artifexServer

# 实时日志
pm2 logs artifexServer --lines 100
```

## 相关资源

- [NestJS 官方文档](https://docs.nestjs.com)
- [NestJS 社区 Discord](https://discord.gg/G7Qnnhy)
- [NestJS 视频课程](https://courses.nestjs.com/)
- [NestJS Mau 部署平台](https://mau.nestjs.com)
- [NestJS Devtools](https://devtools.nestjs.com)
- [PM2 官方文档](https://pm2.keymetrics.io/docs/)

## 许可证

本项目采用 [MIT 许可证](https://github.com/nestjs/nest/blob/master/LICENSE)。
