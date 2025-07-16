# 映像工房 Vercel 部署检查清单

## ✅ 代码准备
- [x] 移除调试console.log
- [x] 清理临时脚本文件
- [x] 更新环境变量示例
- [x] 检查构建配置

## 🔧 Vercel 环境变量设置

请在 Vercel Dashboard 中设置以下环境变量：

### 基本配置
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://eizokobo.vercel.app
NEXT_PUBLIC_APP_NAME=映像工房
JWT_SECRET=your-secure-jwt-secret
```

### Stripe 支付
```
STRIPE_SECRET_KEY=rk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 第三方 API
```
OPENAI_API_KEY=sk-proj-your_key
KIE_AI_API_KEY=your_key
KIE_AI_BASE_URL=https://api.kie.ai
```

### 数据库
```
DATABASE_URL=postgresql://your_neon_db_url
```

### 邮件服务
```
SENDGRID_API_KEY=SG.your_key
SENDGRID_FROM_EMAIL=support@eizokobo.com
SENDGRID_FROM_NAME=映像工房
```

### Google OAuth
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 文件存储
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token
```

### 其他配置
```
BCRYPT_SALT_ROUNDS=12
MAX_PROMPT_LENGTH=6000
MAX_IMAGE_SIZE=10485760
TRANSLATION_PROVIDER=openai
TRANSLATION_MODEL=gpt-4o-mini
TRANSLATION_TEMPERATURE=0.3
TRANSLATION_MAX_TOKENS=1000
RATE_LIMIT_TRANSLATE_PER_MINUTE=60
RATE_LIMIT_GENERATE_PER_MINUTE=10
RATE_LIMIT_STATUS_PER_MINUTE=120
```

## 📋 部署后检查

### 1. 基本功能
- [x] 网站正常加载
- [ ] 用户认证（Google OAuth）
- [ ] 邮件发送功能
- [ ] 数据库连接

### 2. 支付流程
- [ ] Stripe 支付页面
- [ ] 支付成功处理
- [ ] Webhook 正常工作
- [ ] 积分自动更新
- [ ] 感谢邮件发送

### 3. 核心功能
- [ ] 图片上传
- [ ] 文本翻译
- [ ] 视频生成
- [ ] 视频历史记录

### 4. 性能优化
- [ ] 页面加载速度
- [ ] API 响应时间
- [ ] 图片优化
- [ ] 缓存设置

## 🔗 重要链接

- **生产网站**: https://eizokobo.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **GitHub Repository**: https://github.com/TheOnlySean/yingxiang-gongfang

## 📝 部署后任务

1. **更新 Stripe Webhook URL**
   - 在 Stripe Dashboard 中将 webhook URL 更新为：
   - `https://eizokobo.vercel.app/api/stripe/webhook`

2. **Google OAuth 重定向 URI**
   - 在 Google Cloud Console 中添加：
   - `https://eizokobo.vercel.app/auth/google/callback`

3. **测试完整流程**
   - 注册/登录
   - 购买积分
   - 生成视频
   - 检查邮件

## 🚀 完成部署

部署完成后，请进行全面测试并记录任何问题。 