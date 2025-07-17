# 映像工房 - 完整域名更新指南

## 🎯 域名更新概览

**旧域名**: `eizokobo.vercel.app`
**新域名**: `eizokobo.com`

## 📋 完整更新清单

### ✅ 已完成的更新

#### 1. **Vercel 环境变量** ✅
- [x] `NEXT_PUBLIC_APP_URL` 已更新为 `https://eizokobo.com`
- [x] 生产环境部署已使用新域名

#### 2. **项目配置文件** ✅
- [x] `environments/production.env` 已更新
- [x] `environments/production 2.env` 已更新

### ⚠️ 需要手动更新的第三方服务

#### 1. **Stripe 支付系统** ⚠️ 最重要
- [ ] **Webhook URL**: `https://eizokobo.com/api/stripe/webhook`
- [ ] **商户设置**: 更新网站URL为 `https://eizokobo.com`
- [ ] **测试支付流程**: 确保积分购买正常

**详细指南**: 参考 `STRIPE_DOMAIN_UPDATE_GUIDE.md`

#### 2. **Google OAuth** ⚠️ 必须更新
- [ ] **授权回调URL**: 添加 `https://eizokobo.com/auth/google/callback`
- [ ] **授权来源域名**: 添加 `https://eizokobo.com`
- [ ] **测试登录流程**: 确保Google登录正常

**详细指南**: 参考 `GOOGLE_OAUTH_DOMAIN_UPDATE_GUIDE.md`

#### 3. **Line OAuth** ⚠️ 如果使用
- [ ] **Line Developer Console**: 更新回调URL
- [ ] **回调URL**: `https://eizokobo.com/auth/line/callback`

#### 4. **SendGrid 邮件服务** ℹ️ 可选
- [ ] **发件人域名**: 如果使用自定义发件人域名
- [ ] **邮件模板**: 更新邮件中的链接URL

## 🔧 详细更新步骤

### 1. Stripe 更新（最重要）
```bash
# 1. 登录 Stripe Dashboard
# 2. 进入 Developers → Webhooks
# 3. 更新 Webhook URL 为：
https://eizokobo.com/api/stripe/webhook

# 4. 进入 Settings → Business Settings
# 5. 更新网站URL为：
https://eizokobo.com
```

### 2. Google OAuth 更新
```bash
# 1. 登录 Google Cloud Console
# 2. 进入 APIs & Services → Credentials
# 3. 编辑 OAuth 2.0 客户端
# 4. 在 Authorized redirect URIs 中添加：
https://eizokobo.com/auth/google/callback

# 5. 在 Authorized JavaScript origins 中添加：
https://eizokobo.com
```

### 3. Line OAuth 更新（如果使用）
```bash
# 1. 登录 Line Developer Console
# 2. 选择您的 Line Login Channel
# 3. 更新 Callback URL 为：
https://eizokobo.com/auth/line/callback
```

## 🧪 测试验证流程

### 1. 基本访问测试
```bash
# 测试新域名是否可访问
curl -I https://eizokobo.com

# 测试API端点
curl -I https://eizokobo.com/api/auth/verify
```

### 2. Google OAuth 测试
1. 访问 `https://eizokobo.com`
2. 点击 Google 登录
3. 完成授权流程
4. 确认跳转回新域名
5. 检查用户信息显示正常

### 3. Stripe 支付测试
1. 访问 `https://eizokobo.com/credits/purchase`
2. 选择一个充值套餐
3. 完成支付流程
4. 确认跳转到成功页面
5. 检查积分是否正确更新

### 4. 邮件链接测试
1. 触发邮件发送（如忘记密码）
2. 检查邮件中的链接是否指向新域名
3. 点击链接确认跳转正常

## 🚨 常见问题排查

### Q1: Google OAuth 出现 "redirect_uri_mismatch" 错误
**解决方案**:
1. 检查 Google Cloud Console 中的回调URL配置
2. 确认URL格式完全匹配
3. 等待几分钟让配置生效

### Q2: Stripe 支付成功但积分未更新
**解决方案**:
1. 检查 Stripe Webhook URL 是否正确更新
2. 查看 Stripe Dashboard 中的 Webhook 日志
3. 检查 Vercel 部署日志

### Q3: 邮件中的链接仍指向旧域名
**解决方案**:
1. 检查 `NEXT_PUBLIC_APP_URL` 环境变量
2. 重新部署应用
3. 清除邮件服务缓存

## 📊 监控检查

### 1. 实时监控
- 🔍 **Vercel Analytics**: 检查新域名的访问情况
- 📊 **Stripe Dashboard**: 监控支付和 Webhook 状态
- 📧 **SendGrid Dashboard**: 监控邮件发送状态

### 2. 日志检查
```bash
# 查看 Vercel 部署日志
vercel logs

# 查看 Stripe Webhook 日志
# 在 Stripe Dashboard → Webhooks 中查看

# 查看 Google OAuth 日志
# 在开发环境中观察控制台输出
```

## 🔄 回滚计划

如果新域名出现问题，可以快速回滚：

### 1. 紧急回滚步骤
```bash
# 1. 在 Vercel 中将 NEXT_PUBLIC_APP_URL 改回：
https://eizokobo.vercel.app

# 2. 重新部署应用
vercel --prod

# 3. 通知用户临时使用旧域名
```

### 2. 第三方服务回滚
- **Stripe**: Webhook URL 改回旧域名
- **Google**: 暂时禁用新域名的回调URL
- **DNS**: 如果需要，临时修改DNS解析

## 🎯 完成后的验证

### 最终检查清单
- [ ] 新域名可以正常访问
- [ ] Google OAuth 登录流程正常
- [ ] Stripe 支付和积分更新正常
- [ ] 邮件中的链接指向新域名
- [ ] 所有API端点正常工作
- [ ] 移动端和桌面端都正常
- [ ] 生产环境稳定运行

### 性能检查
- [ ] 页面加载速度正常
- [ ] API响应时间正常
- [ ] 图片和资源加载正常
- [ ] CDN缓存工作正常

## 📝 更新记录

- **2024-01-XX**: 开始域名迁移
- **环境变量**: ✅ 已更新
- **配置文件**: ✅ 已更新
- **Stripe**: ⚠️ 待更新
- **Google OAuth**: ⚠️ 待更新
- **Line OAuth**: ⚠️ 待更新（如果使用）

---

## 🚀 下一步行动计划

1. **立即执行**:
   - 更新 Stripe Webhook URL
   - 更新 Google OAuth 回调URL

2. **测试验证**:
   - 完整的用户注册/登录流程
   - 完整的支付购买流程
   - 邮件功能测试

3. **监控观察**:
   - 观察用户反馈
   - 监控错误日志
   - 检查性能指标

4. **文档更新**:
   - 更新用户帮助文档
   - 更新开发者文档
   - 更新部署指南

⚠️ **重要提醒**: 建议在低峰时段进行第三方服务的更新，并做好回滚准备！ 