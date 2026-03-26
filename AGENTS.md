# Artifex Server Agent Guidelines

This file provides instructions for agentic coding agents working in this repository.

## Build/Lint/Test Commands

### Available Scripts

- `npm run build` - Build the application (nest build && copy config files)
- `npm run start:dev` - Start development server with watch mode
- `npm run start:prod` - Start production server
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
npm test -- src/path/to/your.test.ts
```

To run a specific test within a file:

```bash
npm test -- src/path/to/your.test.ts -t "test name pattern"
```

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

- **Entity**: PascalCase + Entity (e.g., `UserEntity`)
- **Constants**: UPPER_SNAKE + CONSTANTS (e.g., `USER_CONSTANTS`)
- **Types**: PascalCase (e.g., `PublicUser`)
- **DTO**: PascalCase + Dto (e.g., `CreateUserDto`)
- **Service**: PascalCase + Service (e.g., `UserService`)
- **Controller**: PascalCase + Controller (e.g., `UserController`)
- **Module**: PascalCase + Module (e.g., `UserModule`)

### TypeScript Guidelines

- Avoid `any` type; use explicit TypeScript types
- Prefer `interface` over `type` for object shapes
- Use `as const` for constant objects to enable literal types
- Export types when they need to be used across modules

### DTO Validation

- Use class-validator decorators for all DTO properties
- Include meaningful error messages in Chinese
- Use appropriate validation decorators:
  - `@IsString()`, `@IsNumber()`, `@IsBoolean()`
  - `@IsNotEmpty()`, `@IsOptional()`
  - `@MinLength()`, `@MaxLength()`
  - `@IsEmail()`, `@IsUrl()`, `@IsEnum()`
  - `@Min()`, `@Max()` for numeric validation

### Service Layer

- Inject repositories using `@InjectRepository()`
- Use `ResponseHelper` for consistent response formatting
- Handle exceptions properly:
  - Throw `NotFoundException` for missing resources
  - Throw `BadRequestException` for invalid input
  - Throw `InternalServerErrorException` for unexpected errors
- Include JSDoc comments for all public methods
- Use proper TypeScript generics for repository types

### Controller Layer

- Use appropriate HTTP method decorators (@Get, @Post, etc.)
- Use parameter decorators (@Body, @Param, @Query, @Headers)
- Apply guards for authentication (@UseGuards(JwtAuthGuard))
- Use custom decorators for access control (@Public(), @AdminOnly())
- Include JSDoc comments with parameter descriptions
- Return Promise<ApiResponse<T>> for all methods
- Set appropriate HTTP status codes with @HttpCode() when needed

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

- Use UUID primary keys for distributed systems: `@PrimaryGeneratedColumn('uuid')`
- Use auto-increment for simple cases: `@PrimaryGeneratedColumn()`
- Include soft delete field: `@Column({ type: 'tinyint', width: 1, default: 1 }) isActive: boolean`
- Add timestamp columns: `@CreateDateColumn()` and `@UpdateDateColumn()`
- Use appropriate column types with length constraints from constants
- Add descriptive comments to columns using `comment:` option

### Constants Structure

Each module's constants should include:

- Pagination configuration (DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT)
- Field selection configurations (PUBLIC, INTERNAL fields)
- Status enumerations
- Role enumerations (if applicable)
- Field length constraints
- Export TypeScript types from constant values using `typeof` patterns

### Error Handling

- Use built-in NestJS exceptions:
  - `NotFoundException` (404)
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `ForbiddenException` (403)
  - `InternalServerErrorException` (500)
- Include error details in the `cause` property when wrapping errors
- Let global exception filter handle formatting
- Never return raw error codes or messages directly

### Imports Order

1. NestJS imports
2. Third-party library imports
3. TypeORM imports
4. Internal project imports (using @ alias)
5. Relative imports (avoid when possible)

Use path aliases defined in tsconfig.json:

- `@/` for src root
- `@modules/` for modules directory
- `@common/` for common directory

### Formatting

- Use Prettier for code formatting (`npm run format`)
- Use ESLint for code quality (`npm run lint`)
- Maximum line length: 100 characters
- Use 2 spaces for indentation
- No trailing commas in single-line objects
- Trailing commas preferred in multi-line objects and arrays
- Semicolons required

### Testing Guidelines

- Place test files alongside source files with `.spec.ts` suffix
- Use Jest testing framework
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Test both success and error cases
- Aim for meaningful test coverage, not just line coverage
- Use descriptive test names that explain the scenario

## Additional Resources

See the detailed rules in:

- `.claude/rules/backend/code-style.md` - Complete NestJS backend guidelines
- `.claude/rules/other/api.md` - API integration specifications

When creating new modules, follow the 6-step process outlined in the backend code-style guide:

1. Create constants
2. Create DTOs
3. Create entities
4. Create services
5. Create controllers
6. Register module in BusinessModule
