# Claude Agent 规范标准

> 基于 AGENTS.md 的统一规范体系，定义 Rules 和 Skills 的标准格式和软连接机制

## 📋 规范体系架构

```
根目录/
├── AGENTS.md                          # L0: Skills 系统（全局能力）
│   └── Skills System
│       └── 软连接引用 .claude/skills/*/SKILL.md
│
.claude/rules/
├── AGENTS.md                          # L1: 全局规则入口（跨领域规则）
│   └── Rules System
│       ├── 软连接引用 .claude/rules/other/*.md
│       └── 软连接引用 .claude/rules/backend/*.md
│
└── frontend/                          # 前端规则（当前项目无前端）
    ├── AGENTS.md
    └── ...
```

## 🎯 核心原则

### 1. 软连接机制

**软连接定义**：
- 在 AGENTS.md 中通过 `<path>` 标签引用规则文件
- 规则文件实际存储在 `.claude/rules/` 目录下
- 通过路径引用实现规则与配置的分离

**软连接格式**：
```markdown
<rule>
<name>rule-name</name>
<description>规则描述</description>
<path>.claude/rules/path/to/rule.md</path>
<globs>src/**/*.ts</globs>
</rule>
```

### 2. 分层嵌套原则

**L0 - 根目录 AGENTS.md**:
- 仅包含 Skills 系统（全局能力）
- 提供专业能力扩展
- 不包含 Rules 系统

**L1 - .claude/rules/AGENTS.md**:
- 全局规则入口（跨领域规则）
- 适用于所有代码：API、安全、测试、后端
- 通过软连接引用 `.claude/rules/other/` 和 `.claude/rules/backend/` 下的规则

**无 L2**:
- 当前项目为纯 NestJS 后端项目
- 不涉及前端规则

### 3. 职责分离原则

- **Rules**: 项目特定的编码标准和最佳实践
- **Skills**: 可复用的专业能力和工作流
- **CLAUDE.md**: 项目级别的快速参考和概览

## 📁 文件结构标准

### Rules 文件结构

```
.claude/rules/
├── AGENTS.md                  # L1: 全局规则入口
├── other/                     # 跨领域规则
│   ├── api.md                # API 对接规范
│   ├── security.md           # 安全规范
│   └── testing.md            # 测试规范
└── backend/                   # 后端规则
    └── code-style.md         # 后端代码风格
```

### Skills 文件结构

```
.claude/skills/
├── frontend-design/
│   ├── SKILL.md
│   └── LICENSE.txt
├── mcp-builder/
│   ├── SKILL.md
│   ├── references/
│   └── scripts/
└── skill-creator/
    ├── SKILL.md
    └── references/
```

## 🔗 软连接引用标准

### L1 全局规则引用格式

```markdown
<rule>
<name>backend-code-style</name>
<description>NestJS 后端代码风格规范：模块结构、DTO 验证、服务层开发。</description>
<path>.claude/rules/backend/code-style.md</path>
<globs>src/modules/**/*.ts</globs>
</rule>
```

```markdown
<rule>
<name>api-spec</name>
<description>RESTful API 设计规范：路由命名、HTTP 方法、响应格式。</description>
<path>.claude/rules/other/api.md</path>
<globs>src/modules/**/*.controller.ts</globs>
</rule>
```

### Skills 引用格式

```markdown
<skill>
<name>skill-name</name>
<description>技能描述</description>
<location>project</location>
</skill>
```

## 📝 规则文件格式标准

### 规则文件 Frontmatter

```markdown
# 规则标题

---
paths: src/**/*.{ts}  # 自动应用的文件路径模式（可选）
---

## 规则内容
...
```

### 规则内容结构

```markdown
# 规则标题

---
paths: 文件路径模式（可选）
---

## 一、概述
规则的目的和适用范围

## 二、核心规范
具体的规范要求

## 三、代码示例
✅ 推荐做法
❌ 避免做法

## 四、最佳实践
...

## 五、检查清单
- [ ] 检查项 1
- [ ] 检查项 2
```

## 🛠️ 规范管理流程

### 新增规则文件

**L1 全局规则**:
1. 在 `.claude/rules/other/` 或 `.claude/rules/backend/` 创建规则文件
2. 按照标准格式编写规则内容
3. 在 `.claude/rules/AGENTS.md` 中添加软连接引用
4. 不需要修改其他层级的 AGENTS.md

### 更新现有规则

1. **直接修改规则文件**: 在 `.claude/rules/` 相应目录修改规则文件
2. **同步文档**: 如需要，更新 `CLAUDE.md` 中的相关说明
3. **不需要修改 AGENTS.md**: 软连接路径保持不变

## ✅ 规范检查清单

### L0 - 根目录 AGENTS.md

- [ ] 仅包含 Skills 系统
- [ ] 不包含 Rules 系统
- [ ] 所有 Skills 正确引用

### L1 - 全局规则 AGENTS.md

- [ ] 包含全局规则系统（跨领域规则）
- [ ] 所有规则通过软连接正确引用
- [ ] 路径指向 `.claude/rules/other/` 或 `.claude/rules/backend/`
- [ ] 路径和描述准确

### 规则文件检查

- [ ] 规则文件位于正确目录
- [ ] 文件命名符合 kebab-case
- [ ] 包含清晰的路径模式（globs）
- [ ] 内容结构完整（概述、规范、示例、实践）
- [ ] 在对应层级的 AGENTS.md 中正确引用

## 🎨 最佳实践

### 软连接管理

1. **路径一致性**: 确保 `<path>` 标签中的路径与实际文件路径一致
2. **相对路径**: 使用相对于项目根目录的路径
3. **路径更新**: 移动规则文件时，同步更新 AGENTS.md 中的软连接

### 规则编写

1. **聚焦单一职责**: 每个规则专注于一个特定领域
2. **提供具体示例**: 包含 ✅ 推荐和 ❌ 避免的代码示例
3. **保持可操作性**: 规则应该是可执行的，而非抽象概念
4. **定期更新**: 随着项目演进更新规则内容

### 分层管理

1. **职责明确**: 每层只管理对应层级的规则
2. **独立维护**: 各层可以独立更新，互不干扰
3. **优先级清晰**: 更具体的规则具有更高优先级

## 📚 参考资源

- **NestJS 官方文档**: https://docs.nestjs.com
- **TypeORM 文档**: https://typeorm.io
- **Cursor Rules 文档**: https://cursor.com/cn/docs/context/rules
- **AGENTS.md 标准**: https://cursor.com/cn/docs/context/rules#agentsmd
- **项目规范**: `.claude/CLAUDE.md`
- **规则文件**: `.claude/rules/`
- **技能文件**: `.claude/skills/`

---

**核心理念**: 软连接引用、分层管理、职责分离、独立维护

**最后更新**: 2026-03-09
