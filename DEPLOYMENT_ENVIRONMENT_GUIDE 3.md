# 🚀 环境部署指南 / Environment Deployment Guide

## 🎯 概述

本指南解决了登录后跳转到错误环境URL的问题，并提供了完整的环境管理解决方案。

## 🔍 问题背景

### 发现的问题
用户在开发环境中完成登录后，被跳转到生产环境的URL (`https://eizokobo.vercel.app`)，而不是本地开发环境 (`http://localhost:3003`)。

### 根本原因
- `.env.local` 文件中的 `NEXT_PUBLIC_APP_URL` 设置为生产环境URL
- Next.js 环境变量优先级：`.env.local` > `.env`
- 导致开发环境中的OAuth回调、支付成功页面等都跳转到生产环境

## ✅ 解决方案

### 1. 环境变量修复
```bash
# 开发环境 (.env.local)
NEXT_PUBLIC_APP_URL="http://localhost:3003"

# 生产环境 (部署到Vercel时)
NEXT_PUBLIC_APP_URL="https://eizokobo.vercel.app"
```

### 2. 环境管理系统
创建了完整的环境管理系统，包括：
- `environments/development.env` - 开发环境配置
- `environments/production.env` - 生产环境配置
- `scripts/switch-environment.js` - 环境切换脚本

## 🛠️ 使用方法

### 开发环境设置
```bash
# 方法1: 使用npm script
npm run env:dev

# 方法2: 直接使用脚本
node scripts/switch-environment.js development
```

### 生产环境设置
```bash
# 方法1: 使用npm script
npm run env:prod

# 方法2: 直接使用脚本
node scripts/switch-environment.js production
```

## 🔄 环境切换流程

### 开发环境切换
1. 运行 `npm run env:dev`
2. 脚本会自动检查URL配置
3. 将 `environments/development.env` 复制到 `.env.local`
4. 显示配置确认信息

### 生产环境切换
1. 运行 `npm run env:prod`
2. 脚本会自动检查URL配置
3. 将 `environments/production.env` 复制到 `.env.local`
4. 显示部署前检查清单

## 🚨 部署到生产环境的检查清单

### 部署前必须确认的事项：

#### 1. URL配置检查
- ✅ `NEXT_PUBLIC_APP_URL` 设置为 `https://eizokobo.vercel.app`
- ✅ 所有OAuth回调URL正确设置
- ✅ 支付成功/失败页面URL正确设置

#### 2. Google OAuth设置
- ✅ Google Cloud Console中的授权回调URL包含：
  - `https://eizokobo.vercel.app/auth/google/callback`
- ✅ 删除或注释掉开发环境的回调URL

#### 3. Stripe设置
- ✅ Stripe Dashboard中的Webhook URL设置为：
  - `https://eizokobo.vercel.app/api/stripe/webhook`
- ✅ 成功页面URL设置正确
- ✅ 取消页面URL设置正确

#### 4. 环境变量验证
- ✅ 所有必要的环境变量已在Vercel中设置
- ✅ 敏感信息（API密钥、数据库URL等）已正确配置

## 🔧 脚本功能

### 环境切换脚本特性
- **自动URL检查**：验证 `NEXT_PUBLIC_APP_URL` 设置是否正确
- **详细提醒**：显示环境特定的注意事项
- **错误检测**：检测常见的配置错误
- **操作指导**：提供下一步操作建议

### 输出示例
```bash
$ npm run env:dev

🔍 URL設定をチェック中...
✅ 環境を 開発環境 に切り替えました
📝 説明: 本地开发环境 - 所有跳转都指向localhost:3003
🌐 APP_URL: http://localhost:3003

🔧 開発環境への切り替えが完了しました

確認事項:
1. ✅ NEXT_PUBLIC_APP_URL: http://localhost:3003
2. ✅ 開発サーバーが localhost:3003 で起動している
3. ✅ OAuth認証の跳转先がローカルになっている

次のステップ:
- npm run dev で開発サーバーを起動
- ブラウザで http://localhost:3003 にアクセス
- 認証機能のテスト
```

## 📁 文件结构

```
映像工房/
├── .env                           # 默认环境变量
├── .env.local                     # 本地环境变量（优先级最高）
├── environments/
│   ├── development.env           # 开发环境配置
│   └── production.env            # 生产环境配置
├── scripts/
│   ├── switch-environment.js     # 环境切换脚本
│   ├── sync-env-from-vercel.js   # Vercel环境同步脚本
│   └── quick-env-sync.js         # 快速环境同步脚本
└── package.json                  # npm脚本配置
```

## 🎯 影响的功能

修复后，以下功能将正确跳转到对应环境：

### 开发环境 (localhost:3003)
- ✅ **Google OAuth 登录**：回调到 `http://localhost:3003/auth/google/callback`
- ✅ **支付成功页面**：跳转到 `http://localhost:3003/credits/success`
- ✅ **注册确认**：邮件链接指向本地环境
- ✅ **密码重置**：邮件链接指向本地环境

### 生产环境 (https://eizokobo.vercel.app)
- ✅ **Google OAuth 登录**：回调到 `https://eizokobo.vercel.app/auth/google/callback`
- ✅ **支付成功页面**：跳转到 `https://eizokobo.vercel.app/credits/success`
- ✅ **注册确认**：邮件链接指向生产环境
- ✅ **密码重置**：邮件链接指向生产环境

## 🔄 开发工作流程

### 日常开发
1. 确保处于开发环境：`npm run env:dev`
2. 启动开发服务器：`npm run dev`
3. 进行开发和测试
4. 提交代码到 Git

### 部署流程
1. 完成开发和测试
2. 切换到生产环境：`npm run env:prod`
3. 本地构建测试：`npm run build`
4. 推送到GitHub（自动部署到Vercel）
5. 验证生产环境功能

## 🚨 常见问题解决

### Q1: 登录后跳转到错误的URL
**解决方案**：
1. 检查当前环境：`cat .env.local | grep NEXT_PUBLIC_APP_URL`
2. 切换正确环境：`npm run env:dev` 或 `npm run env:prod`
3. 重启开发服务器

### Q2: OAuth回调失败
**解决方案**：
1. 确认 Google Cloud Console 中的回调URL设置
2. 检查环境变量是否正确
3. 确认 `NEXT_PUBLIC_APP_URL` 与OAuth设置一致

### Q3: 支付成功后跳转失败
**解决方案**：
1. 检查 Stripe Dashboard 中的成功URL设置
2. 确认环境变量配置正确
3. 验证 `NEXT_PUBLIC_APP_URL` 设置

## 📚 相关代码文件

### 主要受影响的文件：
- `app/api/auth/google/route.ts` - Google OAuth回调URL
- `app/components/MobileAuthSystem.tsx` - 登录成功跳转
- `app/api/stripe/session/[sessionId]/route.ts` - 支付成功跳转

### 环境变量使用示例：
```typescript
// Google OAuth回调URL设置
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
);
```

## 🎉 修复完成确认

### 验证方法
1. 启动开发服务器：`npm run dev`
2. 在移动设备上访问：`http://localhost:3003`
3. 尝试Google登录
4. 确认登录成功后停留在本地环境

### 预期结果
- ✅ 开发环境中的所有跳转都指向 `localhost:3003`
- ✅ 生产环境中的所有跳转都指向 `https://eizokobo.vercel.app`
- ✅ 环境切换简单明了
- ✅ 部署过程有清晰的提醒

---

*文档创建时间: ${new Date().toISOString()}*  
*问题类型: 环境URL跳转错误*  
*修复状态: ✅ 完全解决*  
*影响范围: 开发和生产环境的URL跳转* 