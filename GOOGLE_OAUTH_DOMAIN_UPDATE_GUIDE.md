# 映像工房 - Google OAuth 域名更新指南

## 🎯 更新概览

将自定义域名从 `eizokobo.vercel.app` 更新为 `eizokobo.com` 后，需要在 Google Cloud Console 中更新 OAuth 配置。

## 🔧 必须更新的配置

### 1. **Google Cloud Console 设置** ⚠️ 必须更新

**当前回调URL**：`https://eizokobo.vercel.app/auth/google/callback`
**需要添加**：`https://eizokobo.com/auth/google/callback`

### 2. **详细更新步骤**

#### Step 1: 登录 Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目（映像工房项目）

#### Step 2: 进入 OAuth 配置
1. 在左侧菜单中，选择 **APIs & Services** → **Credentials**
2. 找到您的 OAuth 2.0 客户端 ID
3. 点击编辑按钮（铅笔图标）

#### Step 3: 添加新的授权回调 URL
在 **Authorized redirect URIs** 部分：
1. **保留现有的**：`https://eizokobo.vercel.app/auth/google/callback`
2. **添加新的**：`https://eizokobo.com/auth/google/callback`
3. 点击 **Save** 保存

#### Step 4: 更新授权来源域名（可选）
在 **Authorized JavaScript origins** 部分：
1. **保留现有的**：`https://eizokobo.vercel.app`
2. **添加新的**：`https://eizokobo.com`

## 🎯 为什么保留旧域名？

建议同时保留两个域名的原因：
- 🔄 **渐进式迁移**：确保在完全切换前两个域名都能正常工作
- 🛡️ **备份方案**：如果新域名出现问题，可以快速回退到旧域名
- 🧪 **测试环境**：开发和预览环境可能仍在使用旧域名

## 📋 验证清单

### ✅ 已完成的更新
- [x] Vercel 环境变量 `NEXT_PUBLIC_APP_URL` 已更新为 `https://eizokobo.com`
- [x] 生产环境配置文件已更新
- [x] Stripe Webhook URL 已更新指南已创建

### ⚠️ 需要手动更新的项目
- [ ] **Google Cloud Console** - 添加新的授权回调URL
- [ ] **测试 Google OAuth 登录流程**

## 🧪 测试流程

### 1. 测试新域名登录
1. 访问 `https://eizokobo.com`
2. 点击 Google 登录按钮
3. 完成 Google OAuth 授权
4. 确认能够成功登录并跳转回 `https://eizokobo.com`

### 2. 检查回调URL
确认 Google OAuth 流程中的跳转：
- 用户点击登录 → 跳转到 Google 授权页面
- 用户授权 → Google 跳转回 `https://eizokobo.com/auth/google/callback`
- 处理完成 → 跳转到主页面 `https://eizokobo.com`

### 3. 验证用户信息
登录成功后，检查：
- 用户信息是否正确显示
- 用户会话是否正常
- 积分余额是否正确显示

## 🚨 常见问题

### Q1: 登录后出现 "redirect_uri_mismatch" 错误
**解决方案**：
1. 检查 Google Cloud Console 中的授权回调URL是否正确
2. 确认URL格式完全匹配：`https://eizokobo.com/auth/google/callback`
3. 等待几分钟让配置生效

### Q2: 登录成功但跳转到错误页面
**检查项目**：
1. 确认 `NEXT_PUBLIC_APP_URL` 环境变量正确
2. 检查 `/auth/google/callback/page.tsx` 中的跳转逻辑
3. 查看浏览器开发者工具的网络请求

### Q3: 登录流程中断或无响应
**可能原因**：
- Google OAuth 客户端配置错误
- 网络连接问题
- 服务器端处理错误

## 🔍 调试命令

### 检查当前环境变量
```bash
# 检查 Google OAuth 配置
echo "GOOGLE_CLIENT_ID: $GOOGLE_CLIENT_ID"
echo "NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL"
```

### 测试 Google OAuth 端点
```bash
# 测试 Google OAuth 初始化端点
curl -X GET https://eizokobo.com/api/auth/google

# 测试回调端点可访问性
curl -X GET https://eizokobo.com/auth/google/callback
```

### 查看服务器日志
在开发环境中查看 OAuth 处理日志：
```bash
npm run dev
# 然后在浏览器中测试登录流程，观察控制台输出
```

## 📝 OAuth 流程说明

### 完整的 Google OAuth 流程：
1. **用户点击登录** → 调用 `/api/auth/google`
2. **服务器生成授权URL** → 包含 `redirect_uri=${NEXT_PUBLIC_APP_URL}/auth/google/callback`
3. **用户授权** → Google 跳转到 `https://eizokobo.com/auth/google/callback?code=...`
4. **服务器处理回调** → 获取用户信息并创建会话
5. **登录完成** → 跳转到主页面

### 关键配置点：
- **Google Cloud Console**: 授权回调URL
- **环境变量**: `NEXT_PUBLIC_APP_URL`
- **代码逻辑**: OAuth 客户端配置

## 🎯 下一步操作

1. **立即执行**：在 Google Cloud Console 中添加新的授权回调URL
2. **测试验证**：完成一次完整的 Google OAuth 登录流程
3. **监控检查**：观察登录日志确保正常工作
4. **清理计划**：在确认新域名稳定后，可考虑移除旧域名配置

---

⚠️ **重要提醒**：建议同时保留新旧两个回调URL，确保系统的稳定性和可回退性！ 