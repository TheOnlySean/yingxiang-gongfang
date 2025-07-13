# 贡献指南

欢迎为日语AI视频生成平台贡献代码！本指南将帮助您了解如何参与项目开发。

## 开发环境设置

### 1. 克隆项目
```bash
git clone https://github.com/your-username/japanese-ai-video-generator.git
cd japanese-ai-video-generator
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境变量配置
复制环境变量模板并配置：
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置所需的API密钥：
```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# KIE.AI API
KIE_AI_API_KEY=your_kie_ai_api_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# PayPay (可选)
PAYPAY_API_KEY=your_paypay_api_key
PAYPAY_SECRET_KEY=your_paypay_secret_key

# JWT
JWT_SECRET=your_jwt_secret

# 开发环境
NODE_ENV=development
```

### 4. 数据库设置
按照 [数据库架构文档](./database-schema.md) 设置Supabase数据库。

### 5. 启动开发服务器
```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

## 开发流程

### 1. 创建功能分支
```bash
git checkout -b feature/your-feature-name
```

### 2. 开发功能
- 遵循 [开发规范](./development-guidelines.md)
- 编写单元测试
- 确保代码质量

### 3. 提交代码
```bash
git add .
git commit -m "feat: add your feature description"
```

### 4. 推送分支
```bash
git push origin feature/your-feature-name
```

### 5. 创建Pull Request
在GitHub上创建Pull Request，详细描述您的更改。

## 代码质量要求

### 1. 代码格式化
使用Prettier格式化代码：
```bash
npm run format
```

### 2. 代码检查
使用ESLint检查代码质量：
```bash
npm run lint
```

### 3. 类型检查
使用TypeScript检查类型：
```bash
npm run type-check
```

### 4. 运行测试
```bash
# 单元测试
npm run test

# 集成测试
npm run test:integration

# E2E测试
npm run test:e2e
```

## 提交信息规范

使用Angular提交信息规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型(type)
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式修改
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD相关更改

### 范围(scope)
- `auth`: 认证相关
- `translation`: 翻译功能
- `video`: 视频生成
- `payment`: 支付系统
- `ui`: 用户界面
- `api`: API相关
- `db`: 数据库相关

### 示例
```
feat(translation): add dialogue detection for Japanese prompts

- Add regex patterns for dialogue detection
- Implement romaji conversion for dialogue
- Add unit tests for dialogue processing

Closes #123
```

## 代码审查流程

### 1. 提交Pull Request
- 确保所有测试通过
- 添加详细的描述
- 包含截图或GIF（如果是UI更改）

### 2. 代码审查
- 至少需要一个维护者审查
- 解决所有审查意见
- 确保CI/CD检查通过

### 3. 合并代码
- 使用"Squash and merge"合并
- 删除功能分支

## 测试指南

### 1. 单元测试
为所有新功能编写单元测试：
```javascript
// utils/translation.test.ts
import { detectDialogue } from './translation';

describe('detectDialogue', () => {
  it('should detect Japanese dialogue in quotes', () => {
    const text = '美しい女性が「こんにちは」と言っている';
    const result = detectDialogue(text);
    
    expect(result).toEqual([
      {
        text: 'こんにちは',
        position: { start: 6, end: 11 }
      }
    ]);
  });
});
```

### 2. 集成测试
测试API端点和数据库交互：
```javascript
// __tests__/api/translate.test.ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/translate/route';

describe('/api/translate', () => {
  it('should translate Japanese prompt correctly', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const response = await fetch({
          method: 'POST',
          body: JSON.stringify({
            originalPrompt: '美しい女性が「こんにちは」と言っている'
          })
        });
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.translatedPrompt).toContain('Speak in Japanese');
      }
    });
  });
});
```

### 3. E2E测试
使用Playwright测试完整的用户流程：
```javascript
// e2e/video-generation.spec.ts
import { test, expect } from '@playwright/test';

test('should generate video successfully', async ({ page }) => {
  await page.goto('/');
  
  // 登录
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // 输入prompt
  await page.fill('[data-testid="prompt-input"]', '美しい女性が挨拶している');
  
  // 生成视频
  await page.click('[data-testid="generate-button"]');
  
  // 等待生成完成
  await expect(page.locator('[data-testid="video-result"]')).toBeVisible();
});
```

## 问题报告

### 1. Bug报告
创建issue时请包含：
- 详细的问题描述
- 复现步骤
- 期望行为
- 实际行为
- 系统环境信息
- 截图或错误日志

### 2. 功能请求
创建issue时请包含：
- 功能描述
- 使用场景
- 预期收益
- 实现建议

## 发布流程

### 1. 版本号管理
使用语义化版本号：
- 主版本号：不兼容的API修改
- 次版本号：新功能添加
- 修订版本号：Bug修复

### 2. 发布步骤
```bash
# 更新版本号
npm version patch|minor|major

# 创建发布分支
git checkout -b release/v1.0.0

# 更新CHANGELOG.md
npm run changelog

# 提交更改
git add .
git commit -m "chore: release v1.0.0"

# 推送并创建PR
git push origin release/v1.0.0
```

## 社区行为准则

### 1. 友好和包容
- 使用友好和专业的语言
- 尊重不同的观点和经验
- 接受建设性的批评

### 2. 协作精神
- 帮助新贡献者上手
- 分享知识和经验
- 积极参与讨论

### 3. 质量导向
- 关注代码质量
- 编写清晰的文档
- 进行充分的测试

## 获取帮助

### 1. 文档
- [开发规范](./development-guidelines.md)
- [API文档](./api-documentation.md)
- [数据库架构](./database-schema.md)

### 2. 社区
- GitHub Issues: 报告问题和请求功能
- GitHub Discussions: 技术讨论和Q&A
- Discord: 实时聊天和协作

### 3. 联系方式
- 邮箱: dev@example.com
- GitHub: @maintainer-username

感谢您的贡献！🎉 