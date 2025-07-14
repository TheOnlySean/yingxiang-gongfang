# OAuth集成指南

映像工房现已支持Google和Line OAuth登录功能。本文档详细介绍OAuth的配置和使用方法。

## 🎯 功能概述

- ✅ Google OAuth 2.0集成
- ✅ Line Login API集成  
- ✅ 自动用户创建和账户关联
- ✅ 无缝JWT Token生成
- ✅ 用户头像和显示名同步
- ✅ 新用户自动100点数奖励

## 📋 已实现的组件

### 1. 数据库结构
```sql
-- users表新增OAuth字段
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN line_id VARCHAR(255);
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'email';
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);

-- 索引和约束
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX idx_users_line_id ON users(line_id) WHERE line_id IS NOT NULL;
ALTER TABLE users ADD CONSTRAINT unique_google_id UNIQUE (google_id);
ALTER TABLE users ADD CONSTRAINT unique_line_id UNIQUE (line_id);
```

### 2. API端点

#### Google OAuth
- `GET /api/auth/google` - 获取Google授权URL
- `POST /api/auth/google` - 处理Google OAuth回调

#### Line OAuth  
- `GET /api/auth/line` - 获取Line授权URL
- `POST /api/auth/line` - 处理Line OAuth回调

### 3. 前端组件
- OAuth登录按钮已集成到`WorkingPlayground.tsx`的LoginModal
- Google和Line品牌图标
- 回调处理页面：
  - `/auth/google/callback`
  - `/auth/line/callback`

### 4. 数据库方法
```typescript
// OAuth用户查询
await dbAdmin.getUserByGoogleId(googleId);
await dbAdmin.getUserByLineId(lineId);

// OAuth用户创建
await dbAdmin.createOAuthUser({
  google_id: googleId,
  auth_provider: 'google',
  credits: 100
});

// 账户关联
await dbAdmin.linkOAuthAccount(userId, {
  google_id: googleId,
  avatar_url: avatarUrl
});
```

## ⚙️ 配置指南

### 1. 环境变量配置

在`.env.local`文件中添加：

```bash
# Google OAuth配置
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Line OAuth配置  
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret

# 应用URL（用于OAuth回调）
NEXT_PUBLIC_APP_URL=http://localhost:3003
```

### 2. Google Cloud Console配置

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建新项目或选择现有项目
3. 启用Google+ API
4. 创建OAuth 2.0客户端ID：
   - 应用类型：Web应用
   - 授权JavaScript来源：`http://localhost:3003`
   - 授权重定向URI：`http://localhost:3003/auth/google/callback`

### 3. Line Developers配置

1. 访问 [Line Developers](https://developers.line.biz/en/)
2. 创建新的Channel（Login Channel）
3. 配置回调URL：`http://localhost:3003/auth/line/callback`
4. 复制Channel ID和Channel Secret

## 🔄 OAuth工作流程

### Google OAuth流程

1. 用户点击"Googleでログイン"
2. 重定向到Google授权页面
3. 用户同意授权
4. Google重定向回`/auth/google/callback`
5. 前端获取授权码，调用`/api/auth/google`
6. 后端验证授权码，获取用户信息
7. 检查用户是否存在：
   - 存在：直接登录
   - 不存在但有同邮箱用户：关联账户
   - 全新用户：创建新账户
8. 返回JWT Token，完成登录

### Line OAuth流程

Line流程类似，但通过Line API获取用户信息。

## 🧪 测试方法

### 1. 运行OAuth测试脚本
```bash
node test-oauth.js
```

### 2. 手动测试流程
1. 启动开发服务器：`npm run dev`
2. 访问 `http://localhost:3003`
3. 点击登录按钮
4. 测试Google和Line登录

### 3. 检查数据库
使用Neon Console查看users表，确认OAuth字段正确填充。

## 🔧 故障排除

### 常见问题

1. **"Google OAuth设定エラー"**
   - 检查GOOGLE_CLIENT_ID和GOOGLE_CLIENT_SECRET
   - 确认Google Cloud Console配置正确

2. **"LINE OAuth接続に失敗しました"**
   - 检查LINE_CHANNEL_ID和LINE_CHANNEL_SECRET
   - 确认Line Developers配置正确

3. **回调页面404错误**
   - 确认回调URL配置正确
   - 检查NEXT_PUBLIC_APP_URL设置

4. **数据库错误**
   - 确认OAuth字段已通过迁移添加
   - 检查数据库连接

### 调试技巧

1. 查看浏览器控制台错误
2. 检查网络请求
3. 查看服务器日志
4. 使用Neon Console检查数据库状态

## 📈 性能考虑

- OAuth用户信息缓存在JWT Token中
- 数据库查询已优化索引
- 头像URL按需加载
- 自动清理过期session

## 🔒 安全特性

- OAuth state参数防止CSRF攻击
- JWT Token安全生成
- 敏感信息服务端验证
- 用户权限正确设置

## 🚀 后续优化

可能的改进方向：
- 添加更多OAuth提供商（Facebook, Twitter等）
- 实现账户解绑功能
- 添加OAuth错误重试机制
- 用户profile页面显示绑定状态

## 📝 更新日志

- **2025-01-14**: OAuth基础功能完成
- 数据库迁移：添加OAuth字段
- API实现：Google和Line OAuth
- 前端集成：登录按钮和回调页面
- 文档：集成指南和测试脚本 