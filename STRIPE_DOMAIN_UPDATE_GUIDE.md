# 映像工房 - Stripe 域名更新指南

## 🎯 更新概览

将自定义域名从 `eizokobo.vercel.app` 更新为 `eizokobo.com` 后，需要在 Stripe 中进行以下更新：

## 🔧 必须更新的配置

### 1. **Stripe Webhook URL** ⚠️ 最重要
**当前配置**：`https://eizokobo.vercel.app/api/stripe/webhook`
**更新为**：`https://eizokobo.com/api/stripe/webhook`

**更新步骤**：
1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Developers** → **Webhooks**
3. 找到现有的 webhook endpoint
4. 点击 **Edit** 或 **Update**
5. 将 **Endpoint URL** 更新为：`https://eizokobo.com/api/stripe/webhook`
6. 确保选择的事件包括：
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 2. **支付成功/取消页面 URL** ✅ 自动更新
这些URL通过 `NEXT_PUBLIC_APP_URL` 环境变量自动生成，无需手动更新：
- **成功页面**：`https://eizokobo.com/credits/success?session_id={CHECKOUT_SESSION_ID}`
- **取消页面**：`https://eizokobo.com/credits/purchase`

### 3. **商户设置中的域名**
检查 Stripe Dashboard 中的商户设置：
1. 进入 **Settings** → **Business Settings**
2. 确保 **Website** 字段更新为：`https://eizokobo.com`

## 📋 验证清单

### ✅ 已完成的更新
- [x] Vercel 环境变量 `NEXT_PUBLIC_APP_URL` 已更新为 `https://eizokobo.com`
- [x] 生产环境配置文件已更新
- [x] Line OAuth 回调URL已更新

### ⚠️ 需要手动更新的项目
- [ ] **Stripe Webhook URL** - 需要在 Stripe Dashboard 中手动更新
- [ ] **Google OAuth 回调URL** - 需要在 Google Cloud Console 中添加新域名
- [ ] **商户设置中的网站URL** - 需要在 Stripe Dashboard 中更新

## 🧪 测试流程

### 1. 测试 Webhook 连接
```bash
# 使用 Stripe CLI 测试
stripe listen --forward-to https://eizokobo.com/api/stripe/webhook
```

### 2. 测试支付流程
1. 访问 `https://eizokobo.com/credits/purchase`
2. 选择一个套餐并点击购买
3. 完成支付流程
4. 确认跳转到 `https://eizokobo.com/credits/success`
5. 检查积分是否正确更新

### 3. 检查 Webhook 日志
在 Stripe Dashboard 的 **Webhooks** 部分查看：
- 是否收到 `checkout.session.completed` 事件
- 响应状态是否为 200
- 是否有任何错误消息

## 🚨 常见问题

### Q1: Webhook 更新后仍然失败
**解决方案**：
1. 检查 webhook URL 是否正确
2. 确认 `STRIPE_WEBHOOK_SECRET` 环境变量正确
3. 查看 Vercel 部署日志

### Q2: 支付成功但积分未更新
**可能原因**：
- Webhook 未正确配置
- 数据库连接问题
- 环境变量配置错误

### Q3: 支付页面跳转错误
**检查项目**：
- `NEXT_PUBLIC_APP_URL` 环境变量是否正确
- Vercel 部署是否成功
- 域名DNS解析是否正常

## 🔍 调试命令

### 检查当前环境变量
```bash
# 在 Vercel 中查看
vercel env ls

# 在本地查看
echo $NEXT_PUBLIC_APP_URL
```

### 测试 Webhook 端点
```bash
# 测试 webhook 端点是否可访问
curl -X POST https://eizokobo.com/api/stripe/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### 查看 Stripe 日志
在 Stripe Dashboard 的 **Logs** 部分查看所有API调用和webhook事件。

## 📝 更新记录

- **2024-01-XX**: 域名从 `eizokobo.vercel.app` 更新为 `eizokobo.com`
- **环境变量**: `NEXT_PUBLIC_APP_URL` 已更新
- **配置文件**: `environments/production.env` 已更新
- **待更新**: Stripe Webhook URL

## 🎯 下一步操作

1. **立即执行**：在 Stripe Dashboard 中更新 Webhook URL
2. **测试验证**：完成一次完整的支付流程测试
3. **监控检查**：观察 webhook 日志确保正常工作
4. **文档更新**：更新部署文档中的相关URL

---

⚠️ **重要提醒**：Webhook URL 更新后，建议立即进行测试，确保支付流程正常工作！ 