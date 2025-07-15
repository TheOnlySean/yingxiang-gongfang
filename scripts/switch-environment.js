#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 获取命令行参数
const environment = process.argv[2];

if (!environment) {
  console.error('❌ 请指定环境: development 或 production');
  console.log('使用方法: node scripts/switch-environment.js <environment>');
  process.exit(1);
}

if (environment !== 'development' && environment !== 'production') {
  console.error('❌ 无效的环境名称。请使用 development 或 production');
  process.exit(1);
}

const sourceFile = path.join(__dirname, '..', 'environments', `${environment}.env`);
const targetFile = path.join(__dirname, '..', '.env.local');

try {
  // 检查源文件是否存在
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ 环境配置文件不存在: ${sourceFile}`);
    process.exit(1);
  }

  // 复制环境文件
  fs.copyFileSync(sourceFile, targetFile);
  
  console.log(`✅ 环境已切换到: ${environment}`);
  console.log(`📁 配置文件: ${sourceFile} → .env.local`);
  
  // 显示当前环境信息
  const envContent = fs.readFileSync(sourceFile, 'utf8');
  const appUrl = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);
  const nodeEnv = envContent.match(/NODE_ENV=(.+)/);
  
  if (appUrl && nodeEnv) {
    console.log(`🌐 应用 URL: ${appUrl[1]}`);
    console.log(`🔧 Node 环境: ${nodeEnv[1]}`);
  }
  
  console.log('');
  console.log('⚠️  请确保以下环境变量已正确配置:');
  console.log('- 数据库连接');
  console.log('- API 密钥');
  console.log('- OAuth 配置');
  console.log('- 支付系统配置');
  
} catch (error) {
  console.error(`❌ 环境切换失败: ${error.message}`);
  process.exit(1);
} 