// 测试 SendGrid 邮件发送功能
// 使用方法: node scripts/test-email.js

const sgMail = require('@sendgrid/mail');

// 从环境变量加载配置
require('dotenv').config({ path: '.env.local' });

// 设置 SendGrid API 密钥
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testEmailSending() {
  console.log('🧪 开始测试 SendGrid 邮件发送...\n');

  // 检查环境变量
  console.log('📋 检查环境变量配置:');
  console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ 已设置' : '❌ 未设置');
  console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || '❌ 未设置');
  console.log('SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME || '❌ 未设置');
  console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || '❌ 未设置');
  console.log('');

  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY 未设置，请检查 .env.local 文件');
    process.exit(1);
  }

  // 准备测试邮件
  const testEmail = process.env.SENDGRID_FROM_EMAIL; // 发送给自己进行测试
  const verificationToken = 'test-token-' + Date.now();
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;

  const msg = {
    to: testEmail,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME
    },
    subject: '🧪【测试】映像工房 - 邮件发送测试',
    html: `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>邮件测试 - 映像工房</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #e60033, #ff6b7a);
            color: white;
            text-align: center;
            padding: 30px 20px;
          }
          .content {
            padding: 40px 30px;
          }
          .test-button {
            display: inline-block;
            background: linear-gradient(135deg, #e60033, #ff6b7a);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 映像工房</h1>
            <p>SendGrid 邮件测试</p>
          </div>
          
          <div class="content">
            <h2>✅ 邮件发送测试成功！</h2>
            
            <p>如果您收到这封邮件，说明 SendGrid 配置正确且邮件发送功能正常工作。</p>
            
            <p><strong>测试信息：</strong></p>
            <ul>
              <li>发送时间：${new Date().toLocaleString('ja-JP')}</li>
              <li>测试令牌：${verificationToken}</li>
              <li>应用URL：${process.env.NEXT_PUBLIC_APP_URL}</li>
            </ul>
            
            <p>测试验证链接（仅用于测试，请勿点击）：</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="test-button">
                🧪 测试验证链接
              </a>
            </div>
            
            <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${verificationUrl}
            </p>
          </div>
          
          <div class="footer">
            <p>© 2025 映像工房 - AI动画生成平台</p>
            <p>这是一封测试邮件，SendGrid 配置成功！</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
映像工房 - SendGrid 邮件测试

✅ 邮件发送测试成功！

如果您收到这封邮件，说明 SendGrid 配置正确且邮件发送功能正常工作。

测试信息：
- 发送时间：${new Date().toLocaleString('ja-JP')}
- 测试令牌：${verificationToken}
- 应用URL：${process.env.NEXT_PUBLIC_APP_URL}

测试验证链接：${verificationUrl}

© 2025 映像工房 - AI动画生成平台
这是一封测试邮件，SendGrid 配置成功！
    `
  };

  try {
    console.log('📧 发送测试邮件...');
    console.log('收件人:', testEmail);
    console.log('发件人:', process.env.SENDGRID_FROM_EMAIL);
    console.log('');

    await sgMail.send(msg);
    
    console.log('✅ 测试邮件发送成功！');
    console.log('');
    console.log('请检查邮箱:', testEmail);
    console.log('邮件主题: 🧪【测试】映像工房 - 邮件发送测试');
    console.log('');
    console.log('如果没有收到邮件，请检查：');
    console.log('1. 垃圾邮件文件夹');
    console.log('2. SendGrid API Key 是否正确');
    console.log('3. 发件人邮箱是否已在 SendGrid 中验证');
    console.log('4. SendGrid 账户是否有足够的发送额度');

  } catch (error) {
    console.error('❌ 测试邮件发送失败:', error.message);
    
    if (error.response) {
      console.error('错误详情:', error.response.body);
    }

    console.log('');
    console.log('可能的解决方案：');
    console.log('1. 检查 SENDGRID_API_KEY 是否正确');
    console.log('2. 确认发件人邮箱已在 SendGrid 中验证');
    console.log('3. 检查 SendGrid 账户状态和发送限制');
    console.log('4. 确认网络连接正常');
    
    process.exit(1);
  }
}

// 运行测试
testEmailSending(); 