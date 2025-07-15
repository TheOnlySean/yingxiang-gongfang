# 映像工房 - 部署和环境管理指南

## 🏗️ 分支策略

### 分支结构
```
main (生产分支)
├── development (开发分支)
├── feature/* (功能分支)
└── hotfix/* (紧急修复分支)
```

### 分支说明
- **main**: 生产环境分支，只包含稳定的、经过充分测试的代码
- **development**: 开发环境分支，用于集成和测试新功能
- **feature/***: 功能开发分支，用于开发具体功能
- **hotfix/***: 紧急修复分支，用于快速修复生产环境问题

## 🔄 工作流程

### 1. 新功能开发
```bash
# 从 development 分支创建新功能分支
git checkout development
git pull origin development
git checkout -b feature/new-feature-name

# 开发完成后，合并到 development 分支
git checkout development
git merge feature/new-feature-name
git push origin development
```

### 2. 发布到生产环境
```bash
# 从 development 合并到 main
git checkout main
git merge development
git push origin main
```

### 3. 紧急修复
```bash
# 从 main 分支创建紧急修复分支
git checkout main
git checkout -b hotfix/critical-bug-fix

# 修复完成后，合并到 main 和 development
git checkout main
git merge hotfix/critical-bug-fix
git checkout development
git merge hotfix/critical-bug-fix
```

## 🌐 环境配置

### 环境类型
1. **开发环境 (Development)**
   - 分支: `development`
   - URL: `http://localhost:3003`
   - 数据库: 开发数据库
   - 支付: Stripe 测试模式

2. **生产环境 (Production)**
   - 分支: `main`
   - URL: `https://eizokobo.vercel.app`
   - 数据库: 生产数据库
   - 支付: Stripe 生产模式

### 环境变量管理
- 开发环境: `environments/development.env`
- 生产环境: `environments/production.env`

## 📦 Vercel 部署配置

### 生产环境部署
1. 在 Vercel Dashboard 中设置生产项目
2. 连接到 `main` 分支
3. 配置生产环境变量
4. 设置自动部署

### 开发环境部署
1. 在 Vercel Dashboard 中设置开发项目
2. 连接到 `development` 分支
3. 配置开发环境变量
4. 设置预览部署

## 🛠️ 本地开发设置

### 1. 环境切换
```bash
# 复制对应环境的配置文件
cp environments/development.env .env.local

# 或者生产环境测试
cp environments/production.env .env.local
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 数据库迁移
```bash
# 开发环境
npm run db:migrate:dev

# 生产环境
npm run db:migrate:prod
```

## 🔐 安全考虑

### 1. 环境变量分离
- 开发环境和生产环境使用不同的 API 密钥
- 生产环境使用更强的 JWT 密钥
- 数据库完全分离

### 2. 访问控制
- 生产环境限制管理员访问
- 开发环境允许调试功能
- 测试API只在开发环境启用

### 3. 数据保护
- 生产数据库定期备份
- 开发环境使用匿名化数据
- 敏感信息加密存储

## 📊 监控和日志

### 1. 生产环境监控
- 服务器性能监控
- 数据库性能监控
- 用户行为分析
- 错误报告和警报

### 2. 开发环境调试
- 详细的调试日志
- 性能分析工具
- 测试覆盖率报告

## 🚀 部署检查清单

### 发布前检查
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 环境变量正确配置
- [ ] 数据库迁移完成
- [ ] 第三方服务集成测试
- [ ] 性能测试通过
- [ ] 安全扫描完成

### 发布后检查
- [ ] 生产环境功能正常
- [ ] 支付系统正常
- [ ] 邮件系统正常
- [ ] 监控系统正常
- [ ] 备份系统正常

## 🔧 常用命令

### Git 操作
```bash
# 查看分支状态
git branch -a

# 同步远程分支
git fetch origin

# 切换分支
git checkout branch-name

# 合并分支
git merge branch-name
```

### 环境管理
```bash
# 查看当前环境
echo $NODE_ENV

# 切换到开发环境
export NODE_ENV=development

# 切换到生产环境
export NODE_ENV=production
```

### 部署操作
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行测试
npm test
```

## 📞 支持和联系

如果在部署过程中遇到问题，请：
1. 检查环境变量配置
2. 查看日志文件
3. 确认分支状态
4. 联系开发团队

---

*最后更新: 2024年12月* 