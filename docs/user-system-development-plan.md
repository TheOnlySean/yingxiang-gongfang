# 映像工房用户系统开发规划文档
## 开发日期：2025年7月14日

---

## 📋 项目概览
基于当前**本地版**稳定基础，开发完整的用户端系统，包括认证、支付、Credit管理等核心功能。

---

## 🎯 开发目标清单

### 1. 用户认证系统 (优先级：高)

#### 1.1 基础认证功能
- [ ] **用户注册页面** - `/register`
  - 邮箱注册
  - 密码强度验证
  - 邮箱验证机制
  - 条款同意
  
- [ ] **用户登录页面** - `/login` (优化现有)
  - 邮箱/密码登录
  - "记住我"功能
  - 错误提示优化

#### 1.2 第三方登录集成
- [ ] **Google OAuth 2.0登录**
  - Google登录按钮
  - 账号绑定逻辑
  - 用户信息同步

- [ ] **Line登录集成**
  - Line Login API集成
  - 日本用户友好

#### 1.3 密码管理
- [ ] **忘记密码** - `/forgot-password`
  - 邮箱验证
  - 重置链接发送
  - 安全验证

- [ ] **重设密码** - `/reset-password`
  - 验证重置令牌
  - 新密码设置
  - 密码强度要求

#### 1.4 账号管理
- [ ] **删除账号功能**
  - 用户确认流程
  - 数据清理逻辑
  - 最终确认页面

### 2. Credit系统优化 (优先级：高)

#### 2.1 错误处理优化
- [ ] **视频生成失败处理**
  - 友好的错误信息显示
  - 自动退款提示："動画生成に失敗しました。クレジットを返金いたします。"
  - 退款状态实时更新

#### 2.2 Credit历史记录
- [ ] **Credit使用记录页面** - `/credits/history`
  - 充值记录
  - 消费记录  
  - 退款记录
  - 余额变动历史
  - 导出功能

### 3. 支付系统集成 (优先级：中)

#### 3.1 支付方式集成
- [ ] **Stripe信用卡支付**
  - Stripe Checkout集成
  - 安全支付流程
  - 支付成功/失败处理

- [ ] **PayPay支付集成**
  - PayPay API集成
  - 日本本土支付方式

#### 3.2 充值套餐设计
- [ ] **充值套餐页面** - `/credits/purchase`
  - 基础套餐：750円 = 1,000点
  - 标准套餐：7,500円 = 10,000点  
  - 高级套餐：70,000円 = 100,000点 (含折扣)
  - 套餐推荐逻辑

#### 3.3 价格计算逻辑
- [ ] **消费标准**
  - 视频生成：300点/次
  - 实时余额检查
  - 余额不足提醒

---

## 🏗️ 技术实现方案

### 数据库设计扩展

#### 新增表结构
```sql
-- 用户认证扩展
ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN line_id VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP;

-- Credit交易记录表
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) CHECK (type IN ('purchase', 'consume', 'refund')),
  amount INTEGER NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  paypay_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 支付记录表
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount_jpy INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  paypay_order_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### API路由规划

#### 认证相关API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/verify-email` - 邮箱验证
- `POST /api/auth/forgot-password` - 忘记密码
- `POST /api/auth/reset-password` - 重设密码
- `POST /api/auth/google` - Google登录
- `POST /api/auth/line` - Line登录
- `DELETE /api/auth/delete-account` - 删除账号

#### Credit和支付API
- `GET /api/credits/history` - Credit历史记录
- `POST /api/credits/purchase` - 发起充值
- `POST /api/payments/stripe/webhook` - Stripe webhook
- `POST /api/payments/paypay/callback` - PayPay回调
- `GET /api/credits/balance` - 获取余额

### 前端页面结构

#### 新增页面组件
```
app/
├── auth/
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── verify-email/page.tsx
├── credits/
│   ├── history/page.tsx
│   └── purchase/page.tsx
└── components/
    ├── auth/
    │   ├── GoogleLoginButton.tsx
    │   ├── LineLoginButton.tsx
    │   ├── RegisterForm.tsx
    │   └── PasswordResetForm.tsx
    ├── credits/
    │   ├── CreditHistory.tsx
    │   ├── PurchaseOptions.tsx
    │   └── PaymentForm.tsx
    └── payments/
        ├── StripeCheckout.tsx
        └── PayPayCheckout.tsx
```

---

## 🔧 需要的外部资源和配置

### 1. 第三方服务账号申请
**需要您提供的资源：**

#### Google OAuth 2.0
- [ ] Google Cloud Console项目
- [ ] OAuth 2.0客户端ID
- [ ] 客户端密钥
- [ ] 授权重定向URI配置

#### Line Login
- [ ] Line Developer账号
- [ ] Line Login Channel ID
- [ ] Channel Secret
- [ ] 回调URL设置

#### Stripe支付
- [ ] Stripe商户账号
- [ ] 发布密钥 (Publishable Key)
- [ ] 秘密密钥 (Secret Key)
- [ ] Webhook端点配置

#### PayPay支付
- [ ] PayPay商户账号
- [ ] API凭证
- [ ] 商户ID
- [ ] 回调URL设置

### 2. 环境变量配置
```env
# 新增环境变量
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAY_CLIENT_ID=
PAYPAY_CLIENT_SECRET=
PAYPAY_MERCHANT_ID=
EMAIL_SERVICE_API_KEY=
FRONTEND_URL=http://localhost:3000
```

### 3. 邮件服务
**需要选择并配置：**
- [ ] SendGrid API (推荐)
- [ ] Amazon SES
- [ ] Nodemailer + SMTP

---

## 📅 开发时间线建议

### 第一阶段 (上午)：基础认证系统
1. **用户注册/登录页面优化** (1-2小时)
2. **忘记密码/重设密码功能** (1-2小时)
3. **邮箱验证系统** (1小时)

### 第二阶段 (下午)：第三方登录
1. **Google OAuth集成** (2-3小时)
2. **Line登录集成** (2-3小时)

### 第三阶段 (晚上)：Credit系统
1. **Credit历史页面** (1-2小时)
2. **错误处理优化** (1小时)
3. **余额检查逻辑** (1小时)

### 第四阶段 (次日)：支付系统
1. **Stripe集成** (3-4小时)
2. **PayPay集成** (3-4小时)
3. **充值套餐页面** (2小时)

---

## ⚠️ 开发注意事项

### 安全考虑
- [ ] 所有用户输入验证
- [ ] SQL注入防护
- [ ] XSS攻击防护
- [ ] CSRF令牌验证
- [ ] 支付信息加密存储

### 用户体验
- [ ] 响应式设计
- [ ] 加载状态指示
- [ ] 错误信息本地化（日语）
- [ ] 无障碍访问支持

### 测试策略
- [ ] 支付流程沙盒测试
- [ ] 第三方登录测试账号
- [ ] Credit计算逻辑验证
- [ ] 错误场景测试

---

## 🔄 与现有系统集成

### 基于本地版的改进
- 保持现有的WorkingPlayground.tsx核心功能
- 优化现有的登录界面
- 增强错误处理和用户反馈
- 保持Vercel Blob图片上传
- 维持KIE.AI视频生成API

### 数据迁移
- 现有用户数据保护
- Credit余额迁移
- 视频历史保留

---

## 🎯 成功指标

### 功能完成度
- [ ] 所有认证流程正常工作
- [ ] 第三方登录成功率 > 95%
- [ ] 支付成功率 > 98%
- [ ] Credit计算准确率 100%

### 用户体验
- [ ] 页面加载时间 < 2秒
- [ ] 支付流程 < 3步完成
- [ ] 错误信息清晰易懂
- [ ] 移动端适配完整

---

**准备完毕后请确认所需的外部资源获取情况，我们明天就可以高效开始开发！** 🚀 