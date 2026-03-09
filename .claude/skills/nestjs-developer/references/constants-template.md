# Constants 常量模板

## 完整结构

```typescript
// src/modules/xxx/constants/xxx.constants.ts

/**
 * XXX 模块常量定义
 */
export const XXX_CONSTANTS = {
  // 分页配置
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },
  
  // 字段选择配置
  SELECT_FIELDS: {
    // 公开字段（不含敏感信息）
    PUBLIC: ['id', 'name', 'description', 'imageUrl', 'status', 'createdAt', 'updatedAt'] as const,
    // 内部字段（包含所有字段）
    INTERNAL: ['id', 'name', 'description', 'imageUrl', 'status', 'isActive', 'createdAt', 'updatedAt'] as const
  },
  
  // 状态枚举
  STATUS: {
    ACTIVE: 1,
    INACTIVE: 0
  },
  
  // 字段长度限制
  CONSTRAINTS: {
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    IMAGE_URL_MAX_LENGTH: 500
  }
} as const

// 状态类型导出
export type XxxStatus = typeof XXX_CONSTANTS.STATUS[keyof typeof XXX_CONSTANTS.STATUS]

export default XXX_CONSTANTS
```

```typescript
// src/modules/xxx/constants/index.ts
export * from './xxx.constants'
```

## 常用常量类型

### 分页常量

```typescript
PAGINATION: {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
}
```

### 字段选择

```typescript
SELECT_FIELDS: {
  PUBLIC: ['id', 'name', 'status', 'createdAt'] as const,
  INTERNAL: ['id', 'name', 'status', 'isActive', 'createdAt'] as const
}
```

### 状态枚举

```typescript
STATUS: {
  ACTIVE: 1,
  INACTIVE: 0
}
```

### 字段限制

```typescript
CONSTRAINTS: {
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000
}
```

