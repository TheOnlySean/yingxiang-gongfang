# Google OAuth 正确URL配置指南

## 🎯 问题发现
根据代码分析，Google OAuth 回调URL是通过 `NEXT_PUBLIC_APP_URL` 环境变量动态生成的：

```typescript
// app/api/auth/google/route.ts
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
);
```

## 🔧 当前环境变量配置

### 开发环境 (.env.local)
```
NEXT_PUBLIC_APP_URL=http://localhost:3003
```
**回调URL**: `http://localhost:3003/auth/google/callback`

### 生产环境 (Vercel)
```
NEXT_PUBLIC_APP_URL=https://eizokobo.com
```
**回调URL**: `https://eizokobo.com/auth/google/callback`

## ⚡ Google Cloud Console 正确配置

### 1. Authorized JavaScript origins
```
http://localhost:3003
https://eizokobo.com
https://eizokobo.vercel.app
```

### 2. Authorized redirect URIs
```
http://localhost:3003/auth/google/callback
https://eizokobo.com/auth/google/callback
https://eizokobo.vercel.app/auth/google/callback
```

## 🚨 立即执行步骤

1. **登录 Google Cloud Console**
2. **进入 APIs & Services → Credentials**
3. **点击您的 OAuth 2.0 客户端 ID**
4. **在 "Authorized redirect URIs" 中添加/确认**：
   - `http://localhost:3003/auth/google/callback`
   - `https://eizokobo.com/auth/google/callback`
   - `https://eizokobo.vercel.app/auth/google/callback`

5. **在 "Authorized JavaScript origins" 中添加/确认**：
   - `http://localhost:3003`
   - `https://eizokobo.com`
   - `https://eizokobo.vercel.app`

6. **保存配置**

## 🧪 测试验证

### 开发环境测试
1. 访问 `http://localhost:3003`
2. 点击 Google 登录
3. 应该重定向到 `http://localhost:3003/auth/google/callback`

### 生产环境测试
1. 访问 `https://eizokobo.com`
2. 点击 Google 登录
3. 应该重定向到 `https://eizokobo.com/auth/google/callback`

## 💡 重要提醒

- **确保所有三个URL都添加到 Google Cloud Console 中**
- **开发环境使用 http://localhost:3003**
- **生产环境使用 https://eizokobo.com**
- **保留旧域名 https://eizokobo.vercel.app 作为备用**

## 🔍 如果仍然失败

检查以下项目：
1. **OAuth consent screen 是否完整配置**
2. **应用是否已发布或添加了测试用户**
3. **域名是否在 "Authorized domains" 中**
4. **是否等待了5-10分钟让配置生效** 