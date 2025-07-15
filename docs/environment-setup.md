# 映像工房 - 环境设置指南

## 🚀 快速开始

### 1. 克隆项目并安装依赖
```bash
git clone [your-repo-url]
cd 映像工房
npm install
```

### 2. 设置开发环境
```bash
# 切换到开发环境
npm run env:dev

# 启动开发服务器
npm run dev
```

### 3. 设置生产环境
```bash
# 切换到生产环境
npm run env:prod

# 构建生产版本
npm run build
```

## 📁 环境文件结构

```
映像工房/
├── environments/
│   ├── development.env    # 开发环境配置
│   └── production.env     # 生产环境配置
├── .env.local            # 当前活动环境 (git忽略)
└── .env.example          # 环境变量示例
```

## 🔧 环境配置步骤

### 1. 复制环境模板
```bash
# 复制并编辑开发环境配置
cp environments/development.env environments/development.env.local
# 编辑 environments/development.env.local 填入真实的开发环境值

# 复制并编辑生产环境配置
cp environments/production.env environments/production.env.local
# 编辑 environments/production.env.local 填入真实的生产环境值
```

### 2. 配置必要的环境变量

#### 数据库配置
```env
# 开发环境
DATABASE_URL=postgresql://user:pass@localhost:5432/eizokobo_dev

# 生产环境
DATABASE_URL=postgresql://user:pass@prod-host:5432/eizokobo_prod
```

#### Google OAuth 配置
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Line OAuth 配置
```env
LINE_CLIENT_ID=your_line_client_id
LINE_CLIENT_SECRET=your_line_client_secret
```

#### 邮件服务配置
```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@eizokobo.com
```

#### 支付系统配置
```env
# 开发环境（测试模式）
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# 生产环境（生产模式）
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 视频生成服务配置
```env
KIE_AI_API_KEY=your_kie_ai_api_key
KIE_AI_API_URL=https://api.kie.ai/v1
```

#### 翻译服务配置
```env
OPENAI_API_KEY=your_openai_api_key
```

## 🔄 环境切换

### 使用npm脚本
```bash
# 切换到开发环境
npm run env:dev

# 切换到生产环境
npm run env:prod
```

### 手动切换
```bash
# 切换到开发环境
node scripts/switch-environment.js development

# 切换到生产环境
node scripts/switch-environment.js production
```

### 验证当前环境
```bash
# 检查当前环境配置
cat .env.local | grep NEXT_PUBLIC_APP_URL
cat .env.local | grep NODE_ENV
```

## 🌐 Vercel 部署配置

### 1. 生产环境部署
- 连接到 `main` 分支
- 使用 `vercel-production.json` 配置
- 环境变量从 `environments/production.env` 复制到 Vercel Dashboard

### 2. 开发环境部署
- 连接到 `development` 分支
- 使用 `vercel-development.json` 配置
- 环境变量从 `environments/development.env` 复制到 Vercel Dashboard

### 3. 部署步骤
```bash
# 1. 在 Vercel Dashboard 创建新项目
# 2. 连接到 GitHub 仓库
# 3. 设置分支：main (生产) / development (开发)
# 4. 复制环境变量到 Vercel 项目设置
# 5. 启用自动部署
```

## 🔒 安全最佳实践

### 1. 环境变量管理
- ✅ 使用不同的 API 密钥用于开发和生产
- ✅ 生产环境使用更强的 JWT 密钥
- ✅ 定期轮换 API 密钥
- ❌ 不要在代码中硬编码敏感信息

### 2. 数据库安全
- ✅ 开发和生产使用不同的数据库
- ✅ 生产数据库启用 SSL
- ✅ 定期备份生产数据库
- ❌ 不要在开发环境使用生产数据

### 3. 第三方服务
- ✅ 支付系统在开发环境使用测试模式
- ✅ 邮件服务使用不同的发送地址
- ✅ OAuth 配置不同的回调URL
- ❌ 不要在开发环境使用生产API密钥

## 🐛 故障排除

### 常见问题

#### 1. 环境变量未生效
```bash
# 检查环境文件是否正确复制
ls -la .env.local

# 重启开发服务器
npm run dev
```

#### 2. OAuth 回调错误
```bash
# 检查回调URL配置
cat .env.local | grep REDIRECT_URI

# 确认 Google/Line 开发者控制台中的回调URL设置
```

#### 3. 数据库连接失败
```bash
# 检查数据库URL
cat .env.local | grep DATABASE_URL

# 测试数据库连接
node -e "console.log(process.env.DATABASE_URL)"
```

#### 4. 支付系统问题
```bash
# 检查Stripe密钥
cat .env.local | grep STRIPE

# 确认使用正确的测试/生产密钥
```

### 日志调试
```bash
# 查看应用日志
npm run dev 2>&1 | tee debug.log

# 查看构建日志
npm run build 2>&1 | tee build.log
```

## 📞 支持

如果遇到环境配置问题：
1. 检查环境变量是否正确设置
2. 确认当前分支和环境匹配
3. 查看相关日志文件
4. 参考部署指南文档

---

*最后更新: 2024年12月* 