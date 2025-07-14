# 故障排除指南

## 图片上传到KIE.AI失败问题

### 问题描述
用户上传图片后，在生成视频时KIE.AI返回failure错误，导致视频生成失败。

### 根本原因
KIE.AI无法访问本地存储的图片URL，因为缺少对应的API路由处理。

### 解决方案

#### 方案一：配置Vercel Blob存储（推荐）

1. **创建Vercel Blob数据库**：
   - 登录 [Vercel Dashboard](https://vercel.com/dashboard)
   - 选择你的项目
   - 点击 `Storage` 标签
   - 点击 `Create Database`
   - 选择 `Blob`
   - 输入数据库名称（如：`image-storage`）
   - 点击 `Create`

2. **获取Token**：
   - 创建后会显示 `BLOB_READ_WRITE_TOKEN`
   - 复制完整的token值

3. **配置环境变量**：
   在 `.env.local` 文件中添加：
   ```bash
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyy
   ```

4. **验证配置**：
   - 重启开发服务器：`npm run dev`
   - 上传图片，检查控制台日志
   - 应该看到：`Using Vercel Blob storage for: filename.jpg`

#### 方案二：使用本地存储（备选方案）

如果不想配置Vercel Blob，现有的本地存储方案也已经修复：

1. **API路由已创建**：`/api/uploads/[filename]/route.ts`
2. **图片可以通过以下URL访问**：`http://localhost:3001/api/uploads/filename.jpg`
3. **KIE.AI可以正常访问这些URL**

### 验证修复效果

#### 测试本地图片访问
```bash
curl -I http://localhost:3001/api/uploads/1752421006992-ugsia.jpeg
```
应该返回 `200 OK` 状态码。

#### 检查存储方式
上传图片时查看浏览器控制台日志：
- ✅ `Using Vercel Blob storage for: filename.jpg` - 使用Blob存储
- ⚠️ `Using local storage fallback for: filename.jpg` - 使用本地存储

#### 测试完整流程
1. 上传图片
2. 输入日语prompt
3. 生成视频
4. 检查是否成功

### 环境变量配置清单

#### 必需的环境变量
```bash
# 应用基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# 数据库配置
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# 认证配置
JWT_SECRET=your-jwt-secret

# API配置
OPENAI_API_KEY=your-openai-api-key
KIE_AI_API_KEY=your-kie-ai-api-key
KIE_AI_BASE_URL=https://api.kie.ai
```

#### 可选的环境变量（用于优化）
```bash
# Vercel Blob存储（推荐）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxx_yyyyyyyyyyyyyyy

# 支付配置
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### 常见问题

#### Q: 图片上传成功但视频生成失败
**A**: 检查以下几点：
1. 确保 `KIE_AI_API_KEY` 配置正确
2. 检查图片URL是否可以在浏览器中直接访问
3. 查看控制台日志中的错误信息

#### Q: 本地存储的图片返回404
**A**: 确保：
1. 开发服务器正在运行：`npm run dev`
2. 图片文件存在于 `public/uploads/` 目录
3. API路由文件存在：`app/api/uploads/[filename]/route.ts`

#### Q: Vercel Blob配置后仍使用本地存储
**A**: 检查：
1. `BLOB_READ_WRITE_TOKEN` 是否正确配置
2. Token值不能是占位符 `your-blob-token`
3. 重启开发服务器以加载新的环境变量

#### Q: KIE.AI返回认证错误
**A**: 验证：
1. `KIE_AI_API_KEY` 是否正确
2. KIE.AI账户是否有足够的配额
3. API密钥是否已过期

### 性能优化建议

#### 使用Vercel Blob的优势
- ✅ 全球CDN加速
- ✅ 自动压缩和优化
- ✅ 高可用性和可靠性
- ✅ 自动HTTPS
- ✅ KIE.AI可以稳定访问

#### 本地存储的限制
- ⚠️ 仅适用于开发环境
- ⚠️ 服务器重启后文件丢失
- ⚠️ 无CDN加速
- ⚠️ 依赖服务器稳定性

### 部署到生产环境

在部署到Vercel生产环境时：

1. **必须配置Vercel Blob**：
   - 生产环境不支持本地文件存储
   - 在Vercel Dashboard为生产项目创建Blob数据库
   - 配置生产环境的 `BLOB_READ_WRITE_TOKEN`

2. **环境变量同步**：
   - 在Vercel Dashboard的 `Settings > Environment Variables` 中配置所有必需的环境变量
   - 确保生产环境和开发环境使用相同的配置结构

3. **域名配置**：
   - 更新 `NEXT_PUBLIC_APP_URL` 为生产域名
   - 确保KIE.AI可以访问生产域名的图片URL

### 监控和日志

#### 开发环境监控
查看控制台日志了解：
- 图片上传使用的存储方式
- 传递给KIE.AI的图片URL
- KIE.AI的响应状态

#### 生产环境监控
建议配置：
- Vercel Analytics监控性能
- Sentry监控错误
- 自定义日志记录图片上传和视频生成状态

---

如果按照以上步骤操作后仍有问题，请检查：
1. 网络连接是否稳定
2. 防火墙是否阻止了API请求
3. 浏览器是否禁用了某些功能

联系技术支持时，请提供：
- 控制台错误日志
- 环境变量配置（隐藏敏感信息）
- 复现步骤
- 浏览器和操作系统信息 