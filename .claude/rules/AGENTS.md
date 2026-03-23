# 全局规则系统

> L1: 全局规则入口 - 适用于所有代码的跨领域规则

<rules_system priority="1">

## Available Rules

<!-- RULES_TABLE_START -->
<usage>
全局规则自动应用于所有匹配的文件路径。这些规则是跨领域的，适用于整个项目。

How to use rules:

- Rules are automatically applied based on file paths (globs) or context
- Rules can be manually referenced using @rule-name in conversations
- Each rule file is located in `.claude/rules/` directory

Usage notes:

- Rules are context-aware and apply when working on matching files
- Rules can reference other files using @filename syntax
- Rules should be focused and actionable
- Global rules have lower priority than domain-specific rules
</usage>

<available_rules>

<rule>
<name>backend-rules</name>
<description>NestJS 后端开发规范：六层架构（Entity/Constants/Types/DTO/Service/Controller）、模块注册、依赖注入、TypeORM 实体定义、class-validator 验证、@nestjs/swagger 自动生成 API 文档、ResponseHelper 响应格式化、JSDoc 注释规范。技术栈：NestJS + TypeORM + MySQL + TypeScript。</description>
<path>.claude/rules/backend/code-style.md</path>
<globs>src/modules/**/*.ts</globs>
</rule>

<rule>
<name>api-integration</name>
<description>前后端对接规范：接口规范化、请求/响应格式、错误处理、文档约定。本项目后端使用 NestJS + TypeScript，前端使用 Vue 3 + JavaScript。API 接口定义在 src/modules/*/controllers/ 目录。</description>
<path>.claude/rules/other/api.md</path>
<globs>src/modules/**/*controller.ts</globs>
</rule>

</available_rules>

<!-- RULES_TABLE_END -->

</rules_system>
