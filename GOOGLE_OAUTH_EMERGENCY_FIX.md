# Google OAuth 紧急修复指南

## 🚨 问题现状
- 新域名 `https://eizokobo.com` 无法Google登录
- 旧域名 `https://eizokobo.vercel.app` 也无法Google登录
- 错误信息：OAuth 2.0 policy compliance

## 🔧 立即修复步骤

### Step 1: 检查 OAuth Consent Screen 配置
1. **登录 Google Cloud Console**
2. **进入 APIs & Services → OAuth consent screen**
3. **确认以下配置**：

```
App Information:
✓ App name: 映像工房
✓ User support email: 您的邮箱
✓ App logo: (可选)

App domain:
✓ Application home page: https://eizokobo.com
✓ Application privacy policy link: https://eizokobo.com/privacy
✓ Application terms of service link: https://eizokobo.com/terms

Authorized domains:
✓ eizokobo.com
✓ eizokobo.vercel.app (保留旧域名)

Developer contact information:
✓ Email addresses: 您的邮箱
```

### Step 2: 检查应用发布状态
1. **查看应用状态**：
   - 如果显示 "Testing"，这是问题的根源
   - 如果显示 "In production"，跳到 Step 4

2. **如果是 Testing 状态**：
   - 选择 "Add users"
   - 添加您要测试的邮箱地址
   - 保存配置

### Step 3: 恢复两个域名的支持
1. **进入 APIs & Services → Credentials**
2. **编辑 OAuth 2.0 客户端**
3. **确保包含两个域名**：

```
Authorized JavaScript origins:
✓ https://eizokobo.com
✓ https://eizokobo.vercel.app

Authorized redirect URIs:
✓ https://eizokobo.com/auth/google/callback
✓ https://eizokobo.vercel.app/auth/google/callback
```

### Step 4: 紧急发布应用（推荐）
1. **在 OAuth consent screen 中**
2. **点击 "PUBLISH APP"**
3. **选择 "Make available to everyone"**
4. **提交发布请求**

注意：发布后应用会立即可用，无需等待审核（除非使用敏感权限）

## 🧪 测试步骤

### 测试 1: 清除缓存
```bash
# 清除浏览器所有缓存和 cookies
# 或使用无痕模式
```

### 测试 2: 测试旧域名
1. 访问 `https://eizokobo.vercel.app`
2. 点击 Google 登录
3. 检查是否正常

### 测试 3: 测试新域名
1. 访问 `https://eizokobo.com`
2. 点击 Google 登录
3. 检查是否正常

## 🚨 如果仍然无法解决

### 紧急方案 1: 重新创建 OAuth 客户端
1. **在 Google Cloud Console 中**
2. **创建新的 OAuth 2.0 客户端 ID**
3. **重新配置所有设置**
4. **更新环境变量**：
   ```
   GOOGLE_CLIENT_ID=新的客户端ID
   GOOGLE_CLIENT_SECRET=新的客户端密钥
   ```

### 紧急方案 2: 临时使用开发环境
1. **添加开发环境回调URL**：
   ```
   http://localhost:3003/auth/google/callback
   ```
2. **在本地测试功能**
3. **确认配置正确后再处理生产环境**

## 🔍 常见错误和解决方案

### 错误 1: "This app isn't verified"
**解决方案**: 这是正常的，点击 "Advanced" → "Go to 映像工房 (unsafe)"

### 错误 2: "Access blocked: This app's request is invalid"
**解决方案**: 
- 检查 redirect URI 是否完全匹配
- 确认 Authorized domains 包含正确的域名

### 错误 3: "OAuth client not found"
**解决方案**:
- 检查 `GOOGLE_CLIENT_ID` 环境变量
- 确认客户端ID没有输入错误

## 📋 快速检查清单

- [ ] OAuth consent screen 完整填写
- [ ] 应用状态为 "In production" 或已添加测试用户
- [ ] Authorized domains 包含两个域名
- [ ] Redirect URIs 包含两个域名
- [ ] 隐私政策和服务条款链接可访问
- [ ] 清除了浏览器缓存
- [ ] 环境变量配置正确

## 💡 预防措施

1. **保留旧域名配置**：在新域名稳定前不要删除旧配置
2. **分步骤测试**：先在测试环境验证，再应用到生产环境
3. **备份配置**：记录原始配置以便回滚

## 🎯 最可能的解决方案

根据您的描述，最可能的问题是：
1. **应用状态变为 "Testing" 但没有添加测试用户**
2. **OAuth consent screen 配置不完整**

**建议优先尝试**：
1. 检查应用发布状态
2. 如果是 Testing，添加测试用户或发布应用
3. 清除浏览器缓存后重试

---

⚠️ **紧急提醒**：如果需要立即恢复服务，建议先发布应用到生产环境，这样可以立即解决登录问题！ 