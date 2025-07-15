#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 从 Vercel 生产环境同步环境变量...\n');

// 获取项目根目录
const projectRoot = path.join(__dirname, '..');
const developmentEnvPath = path.join(projectRoot, 'environments', 'development.env');
const productionEnvPath = path.join(projectRoot, 'environments', 'production.env');
const envLocalPath = path.join(projectRoot, '.env.local');
const tempEnvPath = path.join(projectRoot, '.env.temp');

try {
  // 1. 从 Vercel 获取环境变量列表
  console.log('📡 从 Vercel 获取生产环境变量列表...');
  const vercelEnvOutput = execSync('vercel env ls production', { 
    encoding: 'utf8',
    cwd: projectRoot
  });
  
  console.log('Vercel 环境变量列表:');
  console.log(vercelEnvOutput);
  
  // 2. 使用 vercel env pull 拉取开发环境变量
  console.log('\n📥 拉取开发环境变量...');
  try {
    // 拉取开发环境变量到临时文件
    execSync(`vercel env pull ${tempEnvPath}`, { 
      encoding: 'utf8',
      cwd: projectRoot
    });
    
    console.log('✅ 成功拉取环境变量');
  } catch (error) {
    console.log('⚠️  拉取失败，尝试创建基础配置...');
  }

  // 3. 读取拉取的环境变量
  let envContent = '';
  if (fs.existsSync(tempEnvPath)) {
    envContent = fs.readFileSync(tempEnvPath, 'utf8');
    console.log('✅ 读取到环境变量文件');
  } else {
    console.log('⚠️  未找到拉取的环境变量文件，使用默认配置');
  }

  // 4. 解析环境变量
  const envVars = {};
  if (envContent) {
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          envVars[key] = value;
          console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
        }
      }
    }
  }

  // 5. 创建开发环境配置文件
  console.log('\n🔧 创建开发环境配置...');
  
  const developmentEnvContent = `# 开发环境配置文件 (自动从 Vercel 同步)
# 生成时间: ${new Date().toISOString()}

# 应用基础配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3003
NEXT_PUBLIC_ENVIRONMENT=development

# 数据库配置 (来自 Vercel)
DATABASE_URL=${envVars.DATABASE_URL || 'your_database_url'}

# 认证配置 (来自 Vercel)
JWT_SECRET=${envVars.JWT_SECRET || 'your_jwt_secret'}
JWT_EXPIRES_IN=${envVars.JWT_EXPIRES_IN || '7d'}

# Google OAuth (来自 Vercel)
GOOGLE_CLIENT_ID=${envVars.GOOGLE_CLIENT_ID || 'your_google_client_id'}
GOOGLE_CLIENT_SECRET=${envVars.GOOGLE_CLIENT_SECRET || 'your_google_client_secret'}

# 邮件服务 (来自 Vercel)
SENDGRID_API_KEY=${envVars.SENDGRID_API_KEY || 'your_sendgrid_api_key'}
SENDGRID_FROM_EMAIL=${envVars.SENDGRID_FROM_EMAIL || 'dev@eizokobo.com'}
SENDGRID_FROM_NAME=${envVars.SENDGRID_FROM_NAME || '映像工房'}

# 支付系统 (来自 Vercel - 开发环境)
STRIPE_SECRET_KEY=${envVars.STRIPE_SECRET_KEY || 'your_stripe_secret_key'}
STRIPE_PUBLISHABLE_KEY=${envVars.STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key'}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${envVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'your_stripe_publishable_key'}
STRIPE_WEBHOOK_SECRET=${envVars.STRIPE_WEBHOOK_SECRET || 'your_stripe_webhook_secret'}

# 视频生成服务 (来自 Vercel)
KIE_AI_API_KEY=${envVars.KIE_AI_API_KEY || 'your_kie_ai_api_key'}
KIE_AI_BASE_URL=${envVars.KIE_AI_BASE_URL || 'https://api.kie.ai/v1'}

# 翻译服务 (来自 Vercel)
OPENAI_API_KEY=${envVars.OPENAI_API_KEY || 'your_openai_api_key'}
OPENAI_MODEL=${envVars.OPENAI_MODEL || 'gpt-4'}
TRANSLATION_PROVIDER=${envVars.TRANSLATION_PROVIDER || 'openai'}
TRANSLATION_MODEL=${envVars.TRANSLATION_MODEL || 'gpt-4'}
TRANSLATION_TEMPERATURE=${envVars.TRANSLATION_TEMPERATURE || '0.1'}
TRANSLATION_MAX_TOKENS=${envVars.TRANSLATION_MAX_TOKENS || '1000'}

# 文件存储 (来自 Vercel)
BLOB_READ_WRITE_TOKEN=${envVars.BLOB_READ_WRITE_TOKEN || 'your_blob_token'}

# 应用配置 (来自 Vercel)
NEXT_PUBLIC_APP_NAME=${envVars.NEXT_PUBLIC_APP_NAME || '映像工房'}
BCRYPT_SALT_ROUNDS=${envVars.BCRYPT_SALT_ROUNDS || '12'}
MAX_PROMPT_LENGTH=${envVars.MAX_PROMPT_LENGTH || '1000'}
MAX_IMAGE_SIZE=${envVars.MAX_IMAGE_SIZE || '10485760'}

# 速率限制 (来自 Vercel)
RATE_LIMIT_TRANSLATE_PER_MINUTE=${envVars.RATE_LIMIT_TRANSLATE_PER_MINUTE || '10'}
RATE_LIMIT_GENERATE_PER_MINUTE=${envVars.RATE_LIMIT_GENERATE_PER_MINUTE || '5'}
RATE_LIMIT_STATUS_PER_MINUTE=${envVars.RATE_LIMIT_STATUS_PER_MINUTE || '30'}

# 开发环境特有配置
DEBUG=true
LOG_LEVEL=debug

# ⚠️ 注意事项:
# - 这些是从 Vercel 开发环境同步的环境变量
# - 如果需要使用生产环境数据，请谨慎操作
# - OAuth 回调 URL 需要在相应平台设置为 localhost:3003
`;

  // 6. 写入开发环境文件
  fs.writeFileSync(developmentEnvPath, developmentEnvContent);
  console.log(`✅ 开发环境配置已更新: ${developmentEnvPath}`);

  // 7. 自动切换到开发环境
  console.log('\n🔄 切换到开发环境...');
  fs.copyFileSync(developmentEnvPath, envLocalPath);
  console.log(`✅ 环境已切换到开发环境: .env.local`);

  // 8. 清理临时文件
  if (fs.existsSync(tempEnvPath)) {
    fs.unlinkSync(tempEnvPath);
    console.log('🧹 清理临时文件');
  }

  // 9. 显示摘要
  console.log('\n📊 同步摘要:');
  console.log(`- 成功获取环境变量: ${Object.keys(envVars).length} 个`);
  console.log(`- 开发环境配置: ${developmentEnvPath}`);
  console.log(`- 当前环境文件: ${envLocalPath}`);
  
  console.log('\n⚠️  重要提醒:');
  console.log('- 环境变量已从 Vercel 同步');
  console.log('- 请确保 OAuth 回调 URL 在相应平台设置为 localhost:3003');
  console.log('- 开发环境现在使用与云端相同的配置');
  
  console.log('\n🚀 环境同步完成！可以运行 npm run dev 启动开发服务器');

} catch (error) {
  console.error('❌ 同步失败:', error.message);
  console.log('\n🔧 可能的解决方案:');
  console.log('1. 确保已登录 Vercel: vercel login');
  console.log('2. 确保在正确的项目目录中');
  console.log('3. 检查 Vercel 项目是否存在');
  console.log('4. 手动运行: vercel env pull .env.local');
  process.exit(1);
} 