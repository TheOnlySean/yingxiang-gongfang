#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 支持的环境
const environments = {
  development: {
    file: 'environments/development.env',
    name: '開発環境',
    expectedUrl: 'http://localhost:3003',
    description: '本地开发环境 - 所有跳转都指向localhost:3003'
  },
  production: {
    file: 'environments/production.env', 
    name: '本番環境',
    expectedUrl: 'https://eizokobo.vercel.app',
    description: '生产环境 - 所有跳转都指向生产域名'
  }
};

// 获取命令行参数
const targetEnv = process.argv[2];

// 显示帮助信息
function showHelp() {
  console.log(`
🔧 環境切替スクリプト / Environment Switcher

使用方法:
  node scripts/switch-environment.js <environment>

利用可能な環境:
  development  - 開発環境 (localhost:3003)
  production   - 本番環境 (https://eizokobo.vercel.app)

例:
  node scripts/switch-environment.js development
  node scripts/switch-environment.js production

npm scripts:
  npm run env:dev    - 開発環境に切り替え
  npm run env:prod   - 本番環境に切り替え
  `);
}

// 检查URL配置
function checkUrlConfiguration(envContent, expectedUrl) {
  const urlMatch = envContent.match(/NEXT_PUBLIC_APP_URL=(.+)/);
  if (!urlMatch) {
    console.log('⚠️  警告: NEXT_PUBLIC_APP_URL が見つかりません');
    return false;
  }
  
  const actualUrl = urlMatch[1].replace(/["']/g, '');
  if (actualUrl !== expectedUrl) {
    console.log(`⚠️  警告: URL不一致`);
    console.log(`   期待値: ${expectedUrl}`);
    console.log(`   実際の値: ${actualUrl}`);
    return false;
  }
  
  return true;
}

// 切换环境
function switchEnvironment(env) {
  const config = environments[env];
  if (!config) {
    console.log(`❌ 無効な環境: ${env}`);
    showHelp();
    return;
  }

  try {
    // 检查环境配置文件是否存在
    if (!fs.existsSync(config.file)) {
      console.log(`❌ 環境設定ファイルが見つかりません: ${config.file}`);
      return;
    }

    // 读取环境配置
    const envContent = fs.readFileSync(config.file, 'utf8');
    
    // 检查URL配置
    console.log(`🔍 URL設定をチェック中...`);
    const urlOk = checkUrlConfiguration(envContent, config.expectedUrl);
    
    // 写入 .env.local
    fs.writeFileSync('.env.local', envContent);
    
    console.log(`✅ 環境を ${config.name} に切り替えました`);
    console.log(`📝 説明: ${config.description}`);
    console.log(`🌐 APP_URL: ${config.expectedUrl}`);
    
    if (!urlOk) {
      console.log(`
⚠️  重要な警告: URL設定に問題があります！
   
   問題の影響:
   - OAuth認証の跳转先が正しくない
   - 支払い成功後の跳转先が正しくない
   - その他のURL跳转が正しくない

   解決方法:
   1. ${config.file} を確認
   2. NEXT_PUBLIC_APP_URL を ${config.expectedUrl} に設定
   3. 再度このスクリプトを実行
      `);
    }
    
    // 环境特定的提醒
    if (env === 'production') {
      console.log(`
🚨 本番環境への切り替えが完了しました

デプロイ前の確認事項:
1. ✅ NEXT_PUBLIC_APP_URL: ${config.expectedUrl}
2. ✅ Google OAuth設定が本番ドメインに対応している
3. ✅ Stripe設定が本番ドメインに対応している
4. ✅ 全ての外部API設定が本番環境用である

次のステップ:
- npm run build でビルドをテスト
- Vercelにデプロイ
- 本番環境での動作確認
      `);
    } else {
      console.log(`
🔧 開発環境への切り替えが完了しました

確認事項:
1. ✅ NEXT_PUBLIC_APP_URL: ${config.expectedUrl}
2. ✅ 開発サーバーが localhost:3003 で起動している
3. ✅ OAuth認証の跳转先がローカルになっている

次のステップ:
- npm run dev で開発サーバーを起動
- ブラウザで http://localhost:3003 にアクセス
- 認証機能のテスト
      `);
    }
    
    console.log(`
📄 変更されたファイル:
- .env.local (${config.file} の内容で上書き)

🔄 元に戻すには:
  node scripts/switch-environment.js <other_environment>
    `);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

// 引数チェック
if (!targetEnv) {
  console.log('❌ 環境を指定してください');
  showHelp();
  process.exit(1);
}

// 実行
switchEnvironment(targetEnv); 