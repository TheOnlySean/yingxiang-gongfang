# Google OAuth 2.0 Policy 错误 - 分步修复指南

## 🚨 当前错误状态
```
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.
Error 400: invalid_request
```

## 🔍 错误分析
这个错误通常是由以下原因导致的：
1. **OAuth Consent Screen 配置不完整**
2. **应用处于 Testing 状态但用户不在测试列表中**
3. **授权域名配置错误**
4. **必需的应用信息缺失**

## 🛠️ 分步修复方案

### Step 1: 检查应用发布状态 ⚠️ 最重要
1. **登录 Google Cloud Console**
2. **进入 APIs & Services → OAuth consent screen**
3. **查看页面顶部的发布状态**：
   - 如果显示 "Testing" - 这就是问题所在
   - 如果显示 "In production" - 跳到 Step 3

### Step 2: 发布应用到生产环境
如果应用状态是 "Testing"：
1. **点击 "PUBLISH APP" 按钮**
2. **选择 "Make available to everyone"**
3. **点击 "Confirm"**
4. **等待几分钟让更改生效**

### Step 3: 完善 OAuth Consent Screen 配置
确保以下所有字段都已正确填写：

#### App Information (必填)
```
App name: 映像工房
User support email: 您的Gmail邮箱
App logo: (可选，但建议上传)
```

#### App domain (必填)
```
Application home page: https://eizokobo.com
Application privacy policy link: https://eizokobo.com/privacy
Application terms of service link: https://eizokobo.com/terms
```

#### Authorized domains (必填)
```
eizokobo.com
```

#### Developer contact information (必填)
```
Email addresses: 您的Gmail邮箱
```

### Step 4: 验证 Credentials 配置
1. **进入 APIs & Services → Credentials**
2. **点击您的 OAuth 2.0 客户端 ID**
3. **确认以下配置**：

#### Authorized JavaScript origins:
```
https://eizokobo.com
https://eizokobo.vercel.app
```

#### Authorized redirect URIs:
```
https://eizokobo.com/auth/google/callback
https://eizokobo.vercel.app/auth/google/callback
```

### Step 5: 清除缓存并测试
1. **清除浏览器缓存和Cookie**
2. **使用无痕/隐私模式**
3. **测试登录流程**

## 🔧 如果问题仍然存在

### 临时解决方案：添加测试用户
如果您不想发布应用，可以：
1. **在 OAuth consent screen 中找到 "Test users"**
2. **点击 "ADD USERS"**
3. **添加您要测试的Gmail邮箱**
4. **保存配置**

### 检查应用是否被暂停
1. **在 Google Cloud Console 中查看是否有任何警告**
2. **检查是否收到来自 Google 的邮件**
3. **确认应用没有被暂停或限制**

## 🎯 完成后验证清单
- [ ] 应用状态为 "In production" 或已添加测试用户
- [ ] OAuth consent screen 所有必填字段已完成
- [ ] 授权域名包含 eizokobo.com
- [ ] 重定向URI包含两个域名的回调地址
- [ ] 清除浏览器缓存
- [ ] 测试登录功能

## 📞 如果仍有问题
请提供以下信息：
1. Google Cloud Console 中的应用发布状态
2. OAuth consent screen 的配置截图
3. 具体的错误页面截图 