# Google OAuth 错误排查指南

## 🚨 错误信息
```
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.
Error 400: invalid_request
```

## 🔍 常见原因和解决方案

### 1. **OAuth 同意屏幕配置不完整** ⚠️ 最常见

#### 问题：
- OAuth 同意屏幕信息不完整
- 应用状态为 "Testing" 但用户不在测试用户列表中
- 缺少必要的应用信息

#### 解决步骤：
1. **登录 Google Cloud Console**
2. **进入 OAuth consent screen**
3. **检查以下配置**：

```
App name: 映像工房 (或您的应用名称)
User support email: 您的邮箱
Developer contact information: 您的邮箱
App domain: https://eizokobo.com
Authorized domains: eizokobo.com
```

4. **如果应用状态是 "Testing"**：
   - 添加测试用户邮箱
   - 或者申请发布到生产环境

### 2. **域名验证问题**

#### 检查项目：
- **Authorized JavaScript origins**:
  ```
  https://eizokobo.com
  https://eizokobo.vercel.app (保留作为备用)
  ```

- **Authorized redirect URIs**:
  ```
  https://eizokobo.com/auth/google/callback
  https://eizokobo.vercel.app/auth/google/callback (保留作为备用)
  ```

### 3. **应用域名设置**

#### 在 OAuth consent screen 中设置：
- **App domain**: `https://eizokobo.com`
- **Authorized domains**: `eizokobo.com`
- **Privacy Policy URL**: `https://eizokobo.com/privacy`
- **Terms of Service URL**: `https://eizokobo.com/terms`

### 4. **发布状态问题**

#### 如果应用状态是 "Testing"：
**选项 1: 添加测试用户**
1. 在 OAuth consent screen 中
2. 找到 "Test users" 部分
3. 添加您要测试的邮箱地址

**选项 2: 申请发布**
1. 点击 "PUBLISH APP"
2. 提交审核（可能需要几天时间）

## 🔧 详细配置步骤

### Step 1: 检查 OAuth Consent Screen
1. 进入 Google Cloud Console
2. 选择 **APIs & Services** → **OAuth consent screen**
3. 确保以下字段已填写：

```
App Information:
- App name: 映像工房
- User support email: your-email@example.com
- App logo: (可选，但建议添加)

App domain:
- Application home page: https://eizokobo.com
- Application privacy policy link: https://eizokobo.com/privacy
- Application terms of service link: https://eizokobo.com/terms

Authorized domains:
- eizokobo.com

Developer contact information:
- Email addresses: your-email@example.com
```

### Step 2: 检查 Credentials 配置
1. 进入 **APIs & Services** → **Credentials**
2. 编辑您的 OAuth 2.0 客户端
3. 确认配置：

```
Authorized JavaScript origins:
- https://eizokobo.com
- https://eizokobo.vercel.app

Authorized redirect URIs:
- https://eizokobo.com/auth/google/callback
- https://eizokobo.vercel.app/auth/google/callback
```

### Step 3: 处理测试用户
如果应用状态是 "Testing"：
1. 在 OAuth consent screen 中找到 "Test users"
2. 点击 "ADD USERS"
3. 添加您要测试的邮箱地址

## 🧪 测试步骤

### 1. 清除浏览器缓存
```bash
# 清除 Google OAuth 相关的 cookies 和缓存
# 或者使用无痕模式测试
```

### 2. 测试登录流程
1. 访问 `https://eizokobo.com`
2. 点击 Google 登录
3. 检查是否出现同意屏幕
4. 完成授权流程

### 3. 检查错误详情
如果仍然有问题，在 Google Cloud Console 中：
1. 进入 **APIs & Services** → **Credentials**
2. 查看 OAuth 2.0 客户端的详细错误信息

## 🚨 常见错误和解决方案

### Error: "This app isn't verified"
**解决方案**：
- 这是正常的，点击 "Advanced" → "Go to 映像工房 (unsafe)"
- 或者提交应用审核

### Error: "Access blocked: This app's request is invalid"
**解决方案**：
- 检查 redirect URI 是否完全匹配
- 确认域名已添加到 Authorized domains

### Error: "The OAuth client was not found"
**解决方案**：
- 检查 `GOOGLE_CLIENT_ID` 环境变量是否正确
- 确认使用的是正确的客户端 ID

## 📋 快速检查清单

- [ ] OAuth consent screen 已完整填写
- [ ] 应用域名设置正确
- [ ] Authorized domains 包含 `eizokobo.com`
- [ ] Redirect URIs 完全匹配
- [ ] 如果是测试状态，已添加测试用户
- [ ] 清除了浏览器缓存
- [ ] 环境变量 `GOOGLE_CLIENT_ID` 正确

## 🔄 紧急解决方案

如果问题持续存在：

### 方案 1: 创建新的 OAuth 客户端
1. 在 Google Cloud Console 中创建新的 OAuth 2.0 客户端
2. 重新配置所有设置
3. 更新环境变量中的 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET`

### 方案 2: 使用开发环境测试
1. 临时使用 `localhost:3003` 进行测试
2. 在 OAuth 客户端中添加：
   ```
   http://localhost:3003/auth/google/callback
   ```

## 📞 获取帮助

如果问题仍然存在：
1. 检查 Google Cloud Console 中的详细错误信息
2. 查看 Google OAuth 2.0 文档
3. 考虑联系 Google Cloud 支持

---

⚠️ **重要提醒**：配置更改后可能需要几分钟才能生效，请耐心等待并清除浏览器缓存后重试！ 