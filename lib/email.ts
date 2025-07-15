import sgMail from '@sendgrid/mail';

// 设置 SendGrid API 密钥
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// 邮件发送接口
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// 发送邮件的基础函数
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const msg = {
      to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // 从HTML提取纯文本作为fallback
    };

    await sgMail.send(msg);
    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// 共通邮件样式
const getEmailStyles = () => `
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
      line-height: 1.8;
      color: #333;
      background-color: #f8f9fa;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #e60033, #ff6b7a);
      color: white;
      text-align: center;
      padding: 40px 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 1px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px;
    }
    .content h2 {
      color: #e60033;
      font-size: 24px;
      margin-bottom: 24px;
      border-bottom: 2px solid #e60033;
      padding-bottom: 8px;
    }
    .content p {
      margin-bottom: 20px;
      font-size: 16px;
      line-height: 1.8;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #e60033, #ff6b7a);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 24px 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(230, 0, 51, 0.3);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(230, 0, 51, 0.4);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 32px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #e9ecef;
    }
    .warning {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #856404;
    }
    .info-box {
      background-color: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      color: #0d47a1;
    }
    .feature {
      display: flex;
      align-items: center;
      margin: 20px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #e60033;
    }
    .feature-icon {
      font-size: 24px;
      margin-right: 16px;
    }
    .highlight {
      background: linear-gradient(135deg, #fff9c4 0%, #fff3a0 100%);
      border: 2px solid #ffd700;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .highlight-text {
      font-size: 20px;
      font-weight: bold;
      color: #e60033;
    }
    .url-box {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      word-break: break-all;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      border: 1px solid #e9ecef;
      margin: 16px 0;
    }
  </style>
`;

// 生成邮件验证令牌
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

// 1. 欢迎邮件（注册成功后发送）
export async function sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
  const displayName = userName || 'お客様';
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>映像工房へようこそ</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>🎉 ご登録ありがとうございます</h2>
          
          <p>${displayName}様</p>
          
          <p>この度は映像工房にご登録いただき、誠にありがとうございます。</p>
          
          <p>映像工房は、最新のAI技術を活用して、あなたの想像力を美しい動画に変換する革新的なプラットフォームです。</p>
          
          <h3>✨ 映像工房の特徴</h3>
          
          <div class="feature">
            <div class="feature-icon">🇯🇵</div>
            <div>
              <strong>完全日本語対応</strong><br>
              日本語でのプロンプト入力に完全対応。自然な表現で理想の動画を生成できます。
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🖼️</div>
            <div>
              <strong>画像アップロード機能</strong><br>
              お気に入りの画像をアップロードして、動画へと変換できます。
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div>
              <strong>高速処理</strong><br>
              最新のAI技術により、数分で高品質な動画を生成します。
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🎨</div>
            <div>
              <strong>多様なスタイル</strong><br>
              アニメ、リアル、抽象など、様々なスタイルの動画作成が可能です。
            </div>
          </div>
          
          <div class="highlight">
            <div class="highlight-text">
              🎁 新規登録特典：1,000ポイントプレゼント！
            </div>
            <p style="margin-top: 12px; font-size: 16px;">
              約33本の動画を無料でお楽しみいただけます。
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
              🚀 今すぐ動画作成を始める
            </a>
          </div>
          
          <div class="info-box">
            <strong>📞 カスタマーサポート</strong><br>
            ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            平日9:00-18:00（土日祝日除く）
          </div>
          
          <p>映像工房で、あなたの創造力を存分に発揮してください。<br>
          素晴らしい動画作成体験をお楽しみいただけることを心よりお祈りしております。</p>
          
          <p>今後ともよろしくお願いいたします。</p>
        </div>
        
        <div class="footer">
          <p><strong>映像工房 カスタマーサポート</strong></p>
          <p>© 2025 映像工房. All rights reserved.</p>
          <p>このメールは自動配信されています。ご返信いただいてもお答えできませんので、あらかじめご了承ください。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】ご登録ありがとうございます｜AI動画作成を始めましょう 🎬',
    html
  });
}

// 2. 購入感謝邮件
export async function sendPurchaseThankYouEmail(
  email: string, 
  userName: string | undefined,
  purchaseDetails: {
    packageName: string;
    credits: number;
    amount: number;
    sessionId: string;
    purchaseDate: string;
  }
): Promise<boolean> {
  const displayName = userName || 'お客様';
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ご購入ありがとうございます</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>🛍️ ご購入ありがとうございます</h2>
          
          <p>${displayName}様</p>
          
          <p>この度は映像工房をご利用いただき、誠にありがとうございます。<br>
          お客様のご購入手続きが正常に完了いたしました。</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #0d47a1;">📋 ご購入内容</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e3f2fd;">
                <td style="padding: 12px 0; font-weight: bold;">ご購入プラン</td>
                <td style="padding: 12px 0; text-align: right; color: #e60033; font-weight: bold;">${purchaseDetails.packageName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e3f2fd;">
                <td style="padding: 12px 0; font-weight: bold;">追加ポイント</td>
                <td style="padding: 12px 0; text-align: right; color: #e60033; font-weight: bold;">${purchaseDetails.credits.toLocaleString()} ポイント</td>
              </tr>
              <tr style="border-bottom: 1px solid #e3f2fd;">
                <td style="padding: 12px 0; font-weight: bold;">お支払い金額</td>
                <td style="padding: 12px 0; text-align: right; color: #e60033; font-weight: bold;">¥${purchaseDetails.amount.toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e3f2fd;">
                <td style="padding: 12px 0; font-weight: bold;">ご購入日時</td>
                <td style="padding: 12px 0; text-align: right;">${purchaseDetails.purchaseDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold;">取引ID</td>
                <td style="padding: 12px 0; text-align: right; font-family: monospace; font-size: 12px;">${purchaseDetails.sessionId}</td>
              </tr>
            </table>
          </div>
          
          <div class="highlight">
            <div class="highlight-text">
              ${purchaseDetails.credits.toLocaleString()}ポイントがアカウントに追加されました
            </div>
            <p style="margin-top: 12px; font-size: 16px;">
              これで素晴らしい動画作成をお楽しみいただけます！
            </p>
          </div>
          
          <h3>📖 ポイントご利用ガイド</h3>
          <ul style="padding-left: 20px; line-height: 1.8;">
            <li>1回の動画生成につき<strong>300ポイント</strong>が必要です</li>
            <li>ポイントに<strong>有効期限はございません</strong></li>
            <li>動画生成に失敗した場合、ポイントは自動的に返還されます</li>
            <li>追加ポイントのご購入はいつでも可能です</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
              🎬 動画作成を始める
            </a>
          </div>
          
          <div class="info-box">
            <strong>📞 カスタマーサポート</strong><br>
            ご質問やお困りのことがございましたら、お気軽にお問い合わせください。<br>
            <strong>営業時間：</strong>平日 9:00-18:00（土日祝日除く）<br>
            <strong>メール：</strong>support@eizokobo.com
          </div>
          
          <p>今後とも映像工房をよろしくお願いいたします。<br>
          素晴らしい動画作成体験をお楽しみください。</p>
        </div>
        
        <div class="footer">
          <p><strong>映像工房 カスタマーサポート</strong></p>
          <p>© 2025 映像工房. All rights reserved.</p>
          <p>このメールは自動配信されています。ご返信いただいてもお答えできませんので、あらかじめご了承ください。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】ご購入ありがとうございます｜ポイントを追加いたしました 🛍️',
    html
  });
}

// 3. 密码重置邮件
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>パスワード再設定のご案内</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>🔐 パスワード再設定のご案内</h2>
          
          <p>お客様</p>
          
          <p>パスワード再設定のリクエストを承りました。</p>
          
          <p>新しいパスワードを設定するために、下記のボタンをクリックしてください。</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">
              🔑 パスワードを再設定する
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 重要なお知らせ</strong>
            <ul style="margin: 12px 0 0 20px; padding: 0;">
              <li>このリンクは<strong>1時間以内</strong>にご利用ください</li>
              <li>パスワード再設定をお申し込みでない場合は、このメールを無視してください</li>
              <li>アカウントのセキュリティにご不安がある場合は、お気軽にお問い合わせください</li>
            </ul>
          </div>
          
          <p>上記のボタンがクリックできない場合は、下記のURLをブラウザのアドレス欄にコピー&ペーストしてください：</p>
          
          <div class="url-box">
            ${resetUrl}
          </div>
          
          <div class="info-box">
            <strong>🔒 セキュリティについて</strong><br>
            お客様のアカウントのセキュリティを保護するため、定期的にパスワードを変更することをお勧めします。
          </div>
          
          <p>ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。</p>
        </div>
        
        <div class="footer">
          <p><strong>映像工房 カスタマーサポート</strong></p>
          <p>© 2025 映像工房. All rights reserved.</p>
          <p>このメールは自動配信されています。ご返信いただいてもお答えできませんので、あらかじめご了承ください。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】パスワード再設定のご案内 🔐',
    html
  });
}



// 4. 账户安全提醒
export async function sendSecurityAlertEmail(
  email: string, 
  userName: string | undefined,
  alertDetails: {
    alertType: string;
    ipAddress: string;
    location: string;
    timestamp: string;
    userAgent: string;
  }
): Promise<boolean> {
  const displayName = userName || 'お客様';
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>アカウントセキュリティ通知</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>🔒 アカウントセキュリティ通知</h2>
          
          <p>${displayName}様</p>
          
          <p>お客様のアカウントで以下のアクティビティが検出されました。</p>
          
          <div class="warning">
            <h3 style="margin-top: 0;">🚨 検出されたアクティビティ</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #fff3cd;">
                <td style="padding: 12px 0; font-weight: bold;">アクティビティ</td>
                <td style="padding: 12px 0; text-align: right;">${alertDetails.alertType}</td>
              </tr>
              <tr style="border-bottom: 1px solid #fff3cd;">
                <td style="padding: 12px 0; font-weight: bold;">IPアドレス</td>
                <td style="padding: 12px 0; text-align: right; font-family: monospace;">${alertDetails.ipAddress}</td>
              </tr>
              <tr style="border-bottom: 1px solid #fff3cd;">
                <td style="padding: 12px 0; font-weight: bold;">場所</td>
                <td style="padding: 12px 0; text-align: right;">${alertDetails.location}</td>
              </tr>
              <tr style="border-bottom: 1px solid #fff3cd;">
                <td style="padding: 12px 0; font-weight: bold;">時刻</td>
                <td style="padding: 12px 0; text-align: right;">${alertDetails.timestamp}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold;">ブラウザ</td>
                <td style="padding: 12px 0; text-align: right; font-size: 12px;">${alertDetails.userAgent}</td>
              </tr>
            </table>
          </div>
          
          <p><strong>このアクティビティがお客様ご自身によるものの場合、</strong>このメールは無視していただいて結構です。</p>
          
          <p><strong>心当たりがない場合は、</strong>お客様のアカウントのセキュリティを確保するため、以下の対応をお勧めします：</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #0d47a1;">🛡️ 推奨セキュリティ対策</h3>
            <ul style="margin: 12px 0 0 20px; padding: 0;">
              <li>パスワードを直ちに変更する</li>
              <li>他のサービスで同じパスワードを使用している場合は、それらも変更する</li>
              <li>不審なアクティビティがないか、アカウントの履歴を確認する</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password" class="button">
              🔐 パスワードを変更する
            </a>
          </div>
          
          <p>ご不明な点やご不安な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。</p>
          
          <p>お客様のアカウントの安全を確保するため、引き続き監視を行っております。</p>
        </div>
        
        <div class="footer">
          <p><strong>映像工房 カスタマーサポート</strong></p>
          <p>© 2025 映像工房. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】アカウントセキュリティ通知 🔒',
    html
  });
}

// 5. 邮箱验证邮件
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>メールアドレス認証のお願い</title>
      ${getEmailStyles()}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>📧 メールアドレス認証のお願い</h2>
          
          <p>お客様</p>
          
          <p>映像工房にご登録いただき、誠にありがとうございます。</p>
          
          <p>アカウントを有効化するため、下記のボタンをクリックしてメールアドレスの認証を完了してください。</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">
              📧 メールアドレスを認証する
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 重要事項</strong>
            <ul style="margin: 12px 0 0 20px; padding: 0;">
              <li>このリンクは<strong>24時間以内</strong>にご利用ください</li>
              <li>認証が完了しない場合、一部の機能がご利用いただけません</li>
              <li>このメールに心当たりがない場合は、無視していただいて結構です</li>
            </ul>
          </div>
          
          <p>上記のボタンがクリックできない場合は、下記のURLをブラウザのアドレス欄にコピー&ペーストしてください：</p>
          
          <div class="url-box">
            ${verificationUrl}
          </div>
          
          <p>映像工房で、素晴らしい動画作成体験をお楽しみください。</p>
        </div>
        
        <div class="footer">
          <p><strong>映像工房 カスタマーサポート</strong></p>
          <p>© 2025 映像工房. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】メールアドレス認証のお願い ��',
    html
  });
} 