# 环境变量管理指南

## 概述

映像工房项目提供了完整的环境变量管理解决方案，可以轻松地在开发环境和生产环境之间同步配置。

## 🚀 快速开始

### 1. 快速同步环境变量（推荐）

```bash
npm run env:pull
```

这个命令会：
- 直接从 Vercel 拉取最新的环境变量
- 自动创建 `.env.local` 文件
- 立即可用于开发

### 2. 完整同步环境变量（详细信息）

```bash
npm run env:sync
```

这个命令会：
- 显示所有环境变量列表
- 创建详细的开发环境配置文件
- 提供完整的同步报告
- 自动切换到开发环境

## 📁 文件结构

```
映像工房/
├── .env.local                    # 当前使用的环境变量
├── environments/
│   ├── development.env          # 开发环境配置
│   └── production.env           # 生产环境配置
└── scripts/
    ├── sync-env-from-vercel.js  # 完整同步脚本
    ├── quick-env-sync.js        # 快速同步脚本
    └── switch-environment.js    # 环境切换脚本
```

## 🔧 可用命令

| 命令 | 描述 | 使用场景 |
|------|------|----------|
| `npm run env:pull` | 快速拉取环境变量 | 日常开发，快速同步 |
| `npm run env:sync` | 完整同步环境变量 | 首次设置，详细查看 |
| `npm run env:dev` | 切换到开发环境 | 使用本地开发配置 |
| `npm run env:prod` | 切换到生产环境 | 本地测试生产配置 |

## 📝 环境变量说明

### 核心配置
- `DATABASE_URL`: PostgreSQL 数据库连接
- `JWT_SECRET`: JWT 密钥
- `OPENAI_API_KEY`: OpenAI API 密钥
- `KIE_AI_API_KEY`: KIE.AI 视频生成 API 密钥
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob 存储令牌

### 认证服务
- `GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth 客户端密钥

### 邮件服务
- `SENDGRID_API_KEY`: SendGrid API 密钥
- `SENDGRID_FROM_EMAIL`: 发件人邮箱
- `SENDGRID_FROM_NAME`: 发件人名称

### 支付系统
- `STRIPE_SECRET_KEY`: Stripe 私钥
- `STRIPE_PUBLISHABLE_KEY`: Stripe 公钥
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook 密钥

## 🛠️ 使用流程

### 首次设置

1. 确保已登录 Vercel：
   ```bash
   vercel login
   ```

2. 同步环境变量：
   ```bash
   npm run env:sync
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

### 日常开发

1. 拉取最新环境变量：
   ```bash
   npm run env:pull
   ```

2. 直接开发：
   ```bash
   npm run dev
   ```

### 环境切换

```bash
# 切换到开发环境
npm run env:dev

# 切换到生产环境配置（谨慎使用）
npm run env:prod
```

## ⚠️ 注意事项

### 安全性
- 环境变量包含敏感信息，请不要提交到版本控制
- `.env.local` 文件已在 `.gitignore` 中排除

### 生产环境
- 开发环境会使用生产环境的数据库和 API
- 支付系统使用真实配置，测试时请谨慎
- OAuth 回调 URL 需要在相应平台设置为 `localhost:3003`

### 常见问题
1. **权限错误**: 确保已登录 Vercel (`vercel login`)
2. **项目不存在**: 确保在正确的项目目录中
3. **环境变量为空**: 检查 Vercel 项目中是否设置了环境变量

## 🔄 自动化工作流

### 开发流程
```bash
# 1. 同步环境变量
npm run env:pull

# 2. 启动开发服务器
npm run dev

# 3. 开发完成后部署
npm run deploy:dev
```

### 生产部署
```bash
# 1. 切换到生产环境
npm run env:prod

# 2. 构建并部署
npm run deploy:prod
```

## 📊 环境变量监控

同步脚本会显示：
- 成功获取的环境变量数量
- 各环境变量的前缀信息
- 文件位置和状态
- 同步时间戳

## 🎯 最佳实践

1. **定期同步**: 每次开发前运行 `npm run env:pull`
2. **备份配置**: 重要修改前备份 `.env.local`
3. **验证配置**: 同步后检查关键环境变量
4. **安全管理**: 不要在不安全的环境中运行同步脚本

## 🚨 故障排除

### 常见错误

1. **Vercel 未登录**
   ```bash
   vercel login
   ```

2. **项目不存在**
   ```bash
   vercel --cwd . link
   ```

3. **权限不足**
   ```bash
   vercel teams ls
   vercel switch <team-name>
   ```

### 手动同步

如果自动脚本失败，可以手动同步：
```bash
vercel env pull .env.local
```

## 📞 支持

如有问题，请检查：
1. Vercel CLI 版本：`vercel --version`
2. 项目状态：`vercel ls`
3. 环境变量：`vercel env ls` 