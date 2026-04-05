# Artifex Server Agent Guidelines

This file provides instructions for agentic coding agents working in this repository.

## Project Overview

NFT marketplace backend service built with NestJS 11.x, TypeScript, TypeORM, and MySQL. Features include JWT authentication, Tencent Cloud SMS, WeChat/Alipay payments, Redis distributed locks, and Swagger API documentation.

## Build/Lint/Test Commands

### Available Scripts

- `npm run build` - Build the application (nest build && copy config files)
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start development server with debug mode
- `npm run start:prod` - Start production server
- `npm run start:pm2` - Start production server with PM2
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:debug` - Run tests in debug mode
- `npm run test:e2e` - Run end-to-end tests

### Running a Single Test

To run a specific test file:

```bash
npm test -- src/path/to/your.spec.ts
```

To run a specific test within a file:

```bash
npm test -- src/path/to/your.spec.ts -t "test name pattern"
```

**Note**: Currently only basic tests exist (`app.controller.spec.ts`). When adding new modules, create corresponding `.spec.ts` test files.

## Code Style Guidelines

### File Organization

This project follows the NestJS six-layer architecture:

1. Entity (数据库映射)
2. Constants (业务常量、配置)
3. Types (TypeScript 类型)
4. DTO (数据传输层, 输入验证)
5. Service (业务逻辑)
6. Controller (HTTP 处理)

Each module should be organized as:

```
src/modules/[module-name]/
├── constants/
├── dto/
├── entities/
├── services/
├── types/
├── [module-name].controller.ts
└── [module-name].module.ts
```

### Naming Conventions

- **Directories**: kebab-case
- **Entity files**: `[name].entity.ts` (e.g., `user.entity.ts`)
- **Constants files**: `[name].constants.ts` (e.g., `user.constants.ts`)
- **Types files**: `[name].types.ts` (e.g., `user.types.ts`)
- **DTO files**: `[action]-[name].dto.ts` (e.g., `create-user.dto.ts`)
- **Service files**: `[name].service.ts` (e.g., `user.service.ts`)
- **Controller files**: `[name].controller.ts` (e.g., `user.controller.ts`)
- **Module files**: `[name].module.ts` (e.g., `user.module.ts`)

### Class Naming

- **Entity**: PascalCase (e.g., `User`, `PayOrder`)
- **Constants**: UPPER_SNAKE + CONSTANTS (e.g., `USER_CONSTANTS`, `AUTH_CONSTANTS`)
- **Types**: PascalCase (e.g., `PublicUser`, `UserRole`)
- **DTO**: PascalCase + Dto (e.g., `CreateUserDto`, `LoginDto`)
- **Service**: PascalCase + Service (e.g., `UserService`, `WechatPayService`)
- **Controller**: PascalCase + Controller (e.g., `UserController`, `PayController`)
- **Module**: PascalCase + Module (e.g., `UserModule`, `PayModule`)

### TypeScript Guidelines

- Avoid `any` type; use explicit TypeScript types
- Prefer `interface` over `type` for object shapes
- Use `as const` for constant objects to enable literal types
- Export types when they need to be used across modules
- Use `typeof` to extract types from constant values (e.g., `type UserRole = 'user' | 'admin'`)

### DTO Validation

- Use class-validator decorators for all DTO properties
- Include meaningful error messages in Chinese
- Use appropriate validation decorators:
  - `@IsString()`, `@IsNumber()`, `@IsBoolean()`
  - `@IsNotEmpty()`, `@IsOptional()`
  - `@MinLength()`, `@MaxLength()`
  - `@IsEmail()`, `@IsUrl()`, `@IsEnum()`
  - `@Min()`, `@Max()` for numeric validation
  - `@Matches()` for regex validation (e.g., phone number)
- Add Swagger documentation with `@ApiProperty()`:
  ```typescript
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString({ message: '手机号必须是字符串' })
  @Matches(PHONE_REGEX, { message: '请输入正确的手机号格式' })
  phone: string;
  ```

### Service Layer

- Inject repositories using `@InjectRepository()`
- Use `ResponseHelper` for consistent response formatting:
  - `ResponseHelper.success(data, message)` - Success response
  - `ResponseHelper.error(message, data)` - Error response
  - `ResponseHelper.paginated(list, total, page, limit, message)` - Paginated response
- Handle exceptions properly:
  - Throw `NotFoundException` for missing resources
  - Throw `BadRequestException` for invalid input
  - Throw `UnauthorizedException` for authentication failures
  - Throw `ForbiddenException` for permission denied
  - Throw `InternalServerErrorException` for unexpected errors
- Include JSDoc comments for all public methods
- Use proper TypeScript generics for repository types
- Use constants for field selection (e.g., `USER_CONSTANTS.SELECT_FIELDS.PUBLIC`)
- Decrypt sensitive data (like phone numbers) before returning

### Controller Layer

- Use appropriate HTTP method decorators (@Get, @Post, @Put, @Delete, etc.)
- Use parameter decorators (@Body, @Param, @Query, @Headers)
- Apply guards for authentication (@UseGuards(JwtAuthGuard))
- Use custom decorators for access control (@Public(), @AdminOnly())
- Include JSDoc comments with parameter descriptions
- Return Promise<ApiResponse<T>> for all methods
- Set appropriate HTTP status codes with @HttpCode() when needed
- Add Swagger documentation:
  - `@ApiTags('模块名称')` - Group endpoints by module
  - `@ApiOperation({ summary: '描述' })` - Describe endpoint
  - `@ApiBearerAuth('JWT-auth')` - Mark endpoints requiring authentication
  - `@ApiQuery()` - Document query parameters
  - `@ApiParam()` - Document path parameters
- Use pipes for validation and transformation:
  - `ParseIntPipe` - Parse integers
  - `ParseUUIDPipe` - Validate UUIDs
  - `DefaultValuePipe` - Set default values

### Response Format

All responses are automatically wrapped by the global interceptor to:

```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

Use `ResponseHelper` methods:

- `ResponseHelper.success(data, message)`
- `ResponseHelper.paginated(list, total, page, limit, message)`
- Throw appropriate exceptions for errors (handled by global filter)

### Database Entities

- Use auto-increment primary keys: `@PrimaryGeneratedColumn()`
- Use UUID for external identifiers: `@Column({ type: 'varchar', length: 36, unique: true }) id: string`
- Include soft delete field: `@Column({ type: 'tinyint', width: 1, default: 1 }) isActive: boolean`
- Add timestamp columns: `@CreateDateColumn()` and `@UpdateDateColumn()`
- Use appropriate column types with length constraints from constants
- Add descriptive comments to columns using `comment:` option
- Encrypt sensitive data (like phone numbers) before storing
- Use hash fields for searchable encrypted data (e.g., `phoneHash` for encrypted `phone`)
- Use enum types for status fields: `@Column({ type: 'enum', enum: Object.values(CONSTANTS), default: CONSTANTS.DEFAULT })`

### Constants Structure

Each module's constants should include:

- Role/Status enumerations (e.g., `ROLES: { USER: 'user', ADMIN: 'admin' } as const`)
- Field selection configurations (PUBLIC, INTERNAL, FULL fields)
- Pagination configuration (DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT)
- Validation patterns (e.g., phone regex, password rules)
- Field length constraints
- Export TypeScript types from constant values:
  ```typescript
  export type UserRole = 'user' | 'admin';
  export const USER_CONSTANTS = {
    ROLES: { USER: 'user', ADMIN: 'admin' } as const,
    SELECT_FIELDS: {
      PUBLIC: ['id', 'phone', 'nickname'] as (keyof User)[],
      INTERNAL: ['userId', 'id', 'phone'] as (keyof User)[],
    },
    PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 100 } as const,
  } as const;
  ```

### Error Handling

- Use built-in NestJS exceptions:
  - `NotFoundException` (404) - Resource not found
  - `BadRequestException` (400) - Invalid input
  - `UnauthorizedException` (401) - Authentication failed
  - `ForbiddenException` (403) - Permission denied
  - `InternalServerErrorException` (500) - Unexpected errors
- Include error details in the `cause` property when wrapping errors:
  ```typescript
  throw new InternalServerErrorException('用户查询失败，请稍后重试', { cause: error });
  ```
- Let global exception filter handle formatting
- Never return raw error codes or messages directly
- Use Chinese error messages for user-facing errors

### Imports Order

1. NestJS imports
2. Third-party library imports (axios, bcrypt, etc.)
3. TypeORM imports
4. Internal project imports (using @ alias)
5. Relative imports (avoid when possible)

Use path aliases defined in tsconfig.json:

- `@/` for src directory (e.g., `@/modules/user/entities/user.entity`)
- `@` for src root (e.g., `@/common/utils/response.helper`)

**Examples:**
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/user/entities/user.entity';
import { ResponseHelper } from '@/common/utils/response.helper';
import { USER_CONSTANTS } from '@/modules/user/constants';
```

### Formatting

- Use Prettier for code formatting (`npm run format`)
- Use ESLint for code quality (`npm run lint`)
- ESLint configuration: `eslint.config.mjs` (flat config format)
- Maximum line length: 100 characters
- Use 2 spaces for indentation
- No trailing commas in single-line objects
- Trailing commas preferred in multi-line objects and arrays
- Semicolons required
- Single quotes for strings (Prettier default)

### Testing Guidelines

- Place test files alongside source files with `.spec.ts` suffix
- Use Jest testing framework
- Follow Arrange-Act-Assert pattern
- Mock external dependencies (repositories, services)
- Test both success and error cases
- Aim for meaningful test coverage, not just line coverage
- Use descriptive test names that explain the scenario
- Use `beforeEach` to set up testing module:
  ```typescript
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    }).compile();
  });
  ```

**Current Test Coverage**: Basic tests exist in `app.controller.spec.ts`. When adding new modules, create corresponding test files.

## Environment Variables

Required environment variables in `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=artifex
DB_SYNCHRONIZE=false
DB_LOGGING=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Redis Configuration (for distributed locks)
REDIS_HOST=localhost
REDIS_PORT=6379

# Tencent Cloud SMS
TENCENT_SMS_SECRET_ID=your_secret_id
TENCENT_SMS_SECRET_KEY=your_secret_key
TENCENT_SMS_SDK_APP_ID=your_sdk_app_id
TENCENT_SMS_SIGN_NAME=your_sign_name
TENCENT_SMS_TEMPLATE_ID=your_template_id

# WeChat Pay
WECHAT_PAY_APP_ID=your_app_id
WECHAT_PAY_MCH_ID=your_mch_id
WECHAT_PAY_API_KEY=your_api_key

# Alipay
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
```

**Note**: Never commit `.env` file to version control. Use `.env.development` for development environment.

## Special Features

### Encryption Service

- Located in `src/common/services/encryption.service.ts`
- Provides phone number encryption/decryption
- Use `encryptPhone()` before storing to database
- Use `decryptPhone()` before returning to client
- Use `hashPhone()` for searchable hash fields

### Redis Distributed Lock

- Located in `src/common/services/redis-lock.service.ts`
- Use Redlock for distributed locking
- Prevent concurrent operations on same resource
- Example: Prevent duplicate payment processing

### Payment Integration

- **WeChat Pay**: `src/modules/pay/services/wechat-pay.service.ts`
- **Alipay**: `src/modules/pay/services/alipay.service.ts`
- **WeChat OA/MP**: `src/modules/pay/services/wechat-oa.service.ts`, `wechat-mp.service.ts`
- Payment entities: `PayOrder`, `PayDelivery`
- Use payment constants for status and configuration

### Rate Limiting

- Implemented with `@nestjs/throttler`
- Auth rate limit guard: `src/modules/auth/guards/auth-rate-limit.guard.ts`
- Configure limits in module imports

### Health Checks

- Implemented with `@nestjs/terminus`
- Health check endpoint available for monitoring

### Swagger Documentation

- Access at `/api` endpoint when running in development
- Use decorators to document all endpoints
- Include request/response examples
- Group endpoints by module with `@ApiTags()`

## Additional Resources

See the detailed rules in:

- `.claude/rules/backend/code-style.md` - Complete NestJS backend guidelines
- `.claude/rules/other/api.md` - API integration specifications

When creating new modules, follow the 6-step process outlined in the backend code-style guide:

1. Create constants (enumerations, field selections, pagination config)
2. Create types (TypeScript interfaces and types)
3. Create DTOs (with validation decorators and Swagger documentation)
4. Create entities (with encryption for sensitive fields)
5. Create services (with ResponseHelper and proper error handling)
6. Create controllers (with Swagger decorators and guards)
7. Register module in BusinessModule
