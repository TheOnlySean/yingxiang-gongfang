# Google OAuth 紧急配置检查清单

## 🚨 当前状态
- 新旧域名都无法Google登录
- 无痕模式仍然失败
- 错误：OAuth 2.0 policy compliance

## 🔍 最可能的原因
这个错误通常意味着您的Google OAuth应用处于**"Testing"状态**，但您的Gmail账号不在测试用户列表中。

## ⚡ 立即执行的解决方案

### 方案1：发布应用（推荐）
1. **登录 Google Cloud Console**
2. **进入 APIs & Services → OAuth consent screen**
3. **查看顶部状态**：
   - 如果显示 "Testing" 或 "In development"
   - 点击 **"PUBLISH APP"** 按钮
   - 选择 **"Make available to everyone"**
   - 点击 **"Confirm"**

### 方案2：添加测试用户
如果不想发布应用：
1. **在 OAuth consent screen 页面**
2. **找到 "Test users" 部分**
3. **点击 "ADD USERS"**
4. **添加您的Gmail邮箱地址**
5. **点击 "Save"**

## 🔧 必须检查的配置项

### 1. OAuth Consent Screen 必填字段
确保以下字段**全部**填写：
```
✓ App name: 映像工房
✓ User support email: 您的Gmail邮箱
✓ Application home page: https://eizokobo.com
✓ Application privacy policy link: https://eizokobo.com/privacy
✓ Application terms of service link: https://eizokobo.com/terms
✓ Authorized domains: eizokobo.com
✓ Developer contact information: 您的Gmail邮箱
```

### 2. Credentials 配置
在 APIs & Services → Credentials 中：
```
Authorized JavaScript origins:
✓ https://eizokobo.com
✓ https://eizokobo.vercel.app

Authorized redirect URIs:
✓ https://eizokobo.com/auth/google/callback
✓ https://eizokobo.vercel.app/auth/google/callback
```

## 🎯 关键检查点

### 检查1：应用状态
- 进入 OAuth consent screen
- 查看页面顶部的状态指示器
- 如果不是 "In production"，立即发布应用

### 检查2：域名验证
- 确保 eizokobo.com 在 "Authorized domains" 中
- 确保没有拼写错误

### 检查3：隐私政策页面
- 访问 https://eizokobo.com/privacy
- 确保页面正常加载

### 检查4：服务条款页面
- 访问 https://eizokobo.com/terms
- 确保页面正常加载

## 🚀 测试步骤

1. **完成上述配置后**
2. **等待5-10分钟**（Google配置需要时间同步）
3. **清除浏览器所有数据**
4. **使用无痕模式测试**
5. **先测试旧域名**：https://eizokobo.vercel.app
6. **再测试新域名**：https://eizokobo.com

## 📞 如果仍然失败

### 可能的其他原因：
1. **Google项目被暂停**
2. **API配额超限**
3. **域名DNS解析问题**
4. **Google服务临时故障**

### 紧急联系方式：
- 检查 Google Cloud Console 是否有任何警告消息
- 查看是否收到 Google 的邮件通知
- 确认 Google OAuth API 是否已启用

## 🔄 备用方案

如果Google OAuth持续失败，可以临时：
1. 使用邮箱+密码登录
2. 或者创建新的Google Cloud项目
3. 重新配置OAuth应用

---

**重要提醒**：这个错误99%是因为应用处于Testing状态导致的。请首先确认应用发布状态！ 