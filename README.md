# 日语AI视频生成平台

## 项目概述

这是一个专为日本用户打造的AI视频生成平台，解决VEO3模型不支持日语prompt的痛点。通过智能翻译技术，用户可以使用日语创建高质量的AI视频。

## 核心功能

- 🎯 **智能日语翻译**：自动将日语prompt翻译为英语，特别优化对话内容处理
- 🎬 **AI视频生成**：集成kie.ai VEO3模型，支持文本和图片生成视频
- 💳 **本土化支付**：支持信用卡和PayPay支付
- 📱 **日式UI设计**：符合日本用户审美的界面设计
- ⚡ **一键生成**：主打便利性，无需手动确认翻译
- 🖼️ **图片存储**：使用Vercel Blob存储，确保KIE.AI可以正确访问用户上传的图片

## 技术栈

### 前端
- **框架**: Next.js 14 + App Router
- **语言**: TypeScript
- **样式**: Tailwind CSS + Ant Design
- **状态管理**: SWR
- **动画**: Framer Motion

### 后端
- **运行时**: Vercel Serverless Functions
- **数据库**: Supabase (PostgreSQL)
- **缓存**: Vercel KV
- **文件存储**: Vercel Blob

### 集成服务
- **AI翻译**: OpenAI GPT-4
- **视频生成**: kie.ai VEO3 API
- **支付**: Stripe + PayPay
- **部署**: Vercel

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # React组件
│   ├── lib/              # 工具函数
│   └── styles/           # 样式文件
├── docs/                  # 文档
├── public/               # 静态资源
├── types/                # TypeScript类型定义
└── utils/                # 工具函数
```

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境变量配置
复制 `.env.example` 到 `.env.local` 并配置以下变量：

#### 1. 基础配置
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=日语AI视频生成器
```

#### 2. 数据库配置 (Supabase)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

#### 3. API配置
```bash
OPENAI_API_KEY=your_openai_key
KIE_AI_API_KEY=your_kie_ai_key
JWT_SECRET=your_jwt_secret
```

#### 4. **重要：Vercel Blob存储配置**
为了解决图片上传到KIE.AI失败的问题，必须配置Vercel Blob存储：

1. **在Vercel Dashboard设置**：
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 选择你的项目
   - 进入 `Storage` 标签
   - 点击 `Create Database`
   - 选择 `Blob`
   - 创建数据库

2. **获取Token**：
   - 创建后会自动生成 `BLOB_READ_WRITE_TOKEN`
   - 复制这个token

3. **配置环境变量**：
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyy
```

**注意**：请确保使用真实的token，而不是占位符 `your-blob-token`

#### 5. 支付配置 (可选)
```bash
STRIPE_SECRET_KEY=your_stripe_key
PAYPAY_API_KEY=your_paypay_key
```

### 开发运行
```bash
npm run dev
```

访问 `http://localhost:3001`

## 图片上传功能说明

### 上传流程
1. **用户上传图片** → 前端组件
2. **图片验证** → 文件类型、大小检查
3. **存储处理**：
   - 优先使用 **Vercel Blob** 存储（推荐）
   - 备选方案：本地存储 + API路由访问
4. **URL生成** → 返回可访问的图片URL
5. **视频生成** → 将图片URL传递给KIE.AI

### 存储方案对比
| 方案 | 优点 | 缺点 | KIE.AI兼容性 |
|------|------|------|-------------|
| Vercel Blob | 全球CDN、高可用、自动缓存 | 需要配置 | ✅ 完美兼容 |
| 本地存储 | 简单、无需配置 | 服务器重启丢失、性能差 | ⚠️ 需要API路由 |

### 故障排除

#### 问题：图片上传后视频生成失败
**原因**：KIE.AI无法访问图片URL

**解决方案**：
1. 确保配置了正确的 `BLOB_READ_WRITE_TOKEN`
2. 检查控制台日志，确认使用的是Vercel Blob存储
3. 验证生成的图片URL是否可以直接在浏览器中访问

#### 检查存储方式
查看控制台日志：
- ✅ `Using Vercel Blob storage for: filename.jpg` - 正常使用Blob存储
- ⚠️ `Using local storage fallback for: filename.jpg` - 降级到本地存储 