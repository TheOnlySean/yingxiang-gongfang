# 开发规范文档

## 代码规范

### TypeScript规范
- **严格模式**: 启用所有TypeScript严格检查
- **类型定义**: 所有函数、变量必须有明确的类型定义
- **接口命名**: 使用PascalCase，接口名以I开头（如：IUser）
- **枚举命名**: 使用PascalCase，枚举值使用SCREAMING_SNAKE_CASE

### React组件规范
- **组件命名**: 使用PascalCase
- **文件命名**: 组件文件使用PascalCase，其他文件使用kebab-case
- **Props类型**: 每个组件都必须定义Props接口
- **默认导出**: 组件使用默认导出

### 文件结构规范
```
app/
├── components/
│   ├── ui/                 # 基础UI组件
│   ├── forms/              # 表单组件
│   ├── layouts/            # 布局组件
│   └── features/           # 功能组件
├── lib/
│   ├── utils.ts            # 工具函数
│   ├── constants.ts        # 常量定义
│   ├── validations.ts      # 验证规则
│   └── api.ts              # API客户端
├── types/
│   ├── api.ts              # API类型定义
│   ├── user.ts             # 用户相关类型
│   └── video.ts            # 视频相关类型
└── hooks/                  # 自定义React hooks
```

### CSS规范
- **样式框架**: 使用Tailwind CSS
- **组件样式**: 优先使用Tailwind类，复杂样式使用CSS modules
- **颜色系统**: 使用设计系统定义的颜色变量
- **响应式**: 移动端优先设计

### API规范
- **RESTful**: 遵循REST API设计原则
- **错误处理**: 统一的错误响应格式
- **状态码**: 正确使用HTTP状态码
- **文档**: 每个API端点都要有完整的文档

## Git工作流

### 分支命名规范
- **主分支**: `main`
- **开发分支**: `develop`
- **功能分支**: `feature/功能名称`
- **修复分支**: `fix/问题描述`
- **发布分支**: `release/版本号`

### 提交信息规范
使用Angular提交信息规范：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型(type):**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式修改
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

**示例:**
```
feat(auth): add user login functionality

- Add login form component
- Implement authentication API
- Add user session management

Closes #123
```

### 代码审查流程
1. 创建Pull Request
2. 至少一个团队成员审查
3. 通过所有自动化测试
4. 解决所有审查意见
5. 合并到目标分支

## 性能优化规范

### 前端性能
- **图片优化**: 使用Next.js Image组件
- **代码分割**: 使用动态导入
- **缓存策略**: 合理使用SWR缓存
- **打包优化**: 分析和优化bundle size

### API性能
- **响应时间**: API响应时间不超过2秒
- **并发处理**: 合理使用并发和异步处理
- **缓存策略**: 合理使用Redis缓存
- **错误重试**: 实现指数退避重试

## 测试规范

### 单元测试
- **覆盖率**: 代码覆盖率不低于80%
- **测试框架**: 使用Jest + React Testing Library
- **命名规范**: 测试文件以`.test.ts`或`.spec.ts`结尾

### 集成测试
- **API测试**: 测试所有API端点
- **E2E测试**: 使用Playwright测试关键用户流程

## 安全规范

### 前端安全
- **XSS防护**: 所有用户输入都要进行转义
- **CSRF防护**: 实现CSRF token验证
- **敏感信息**: 不在前端存储敏感信息

### 后端安全
- **输入验证**: 所有输入都要进行验证
- **权限控制**: 实现基于角色的访问控制
- **数据加密**: 敏感数据必须加密存储

## 部署规范

### 环境管理
- **开发环境**: 本地开发环境
- **测试环境**: 自动化测试环境
- **生产环境**: 线上生产环境

### 部署流程
1. 代码提交到main分支
2. 自动化测试通过
3. 自动部署到生产环境
4. 监控和日志检查

## 监控和日志

### 错误监控
- **前端错误**: 使用Sentry监控前端错误
- **后端错误**: 使用结构化日志记录
- **性能监控**: 监控API响应时间和错误率

### 日志规范
- **日志级别**: ERROR, WARN, INFO, DEBUG
- **日志格式**: JSON格式结构化日志
- **敏感信息**: 不记录敏感信息到日志

## 文档规范

### 代码文档
- **JSDoc**: 复杂函数必须有JSDoc注释
- **README**: 每个模块都要有README说明
- **API文档**: 使用OpenAPI规范

### 项目文档
- **架构文档**: 系统架构和设计决策
- **部署文档**: 部署和运维指南
- **用户文档**: 用户使用指南 