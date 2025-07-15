#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ 快速环境同步...\n');

const projectRoot = path.join(__dirname, '..');
const envLocalPath = path.join(projectRoot, '.env.local');

try {
  // 直接拉取环境变量到 .env.local
  console.log('📥 从 Vercel 拉取环境变量...');
  execSync('vercel env pull .env.local', { 
    stdio: 'inherit',
    cwd: projectRoot
  });
  
  console.log('\n✅ 环境变量同步完成！');
  console.log(`📁 文件位置: ${envLocalPath}`);
  console.log('🚀 现在可以运行 npm run dev 启动开发服务器');
  
} catch (error) {
  console.error('❌ 同步失败:', error.message);
  console.log('\n🔧 请尝试:');
  console.log('1. vercel login');
  console.log('2. npm run env:sync');
  process.exit(1);
} 