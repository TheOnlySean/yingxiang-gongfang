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

// 生成邮件验证令牌
export function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}

// 发送邮箱验证邮件
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>メール認証 - 映像工房</title>
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
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 300;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #e60033;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content p {
          margin-bottom: 20px;
          font-size: 16px;
          line-height: 1.6;
        }
        .verification-button {
          display: inline-block;
          background: linear-gradient(135deg, #e60033, #ff6b7a);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 25px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .verification-button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        .warning {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>メールアドレスの認証</h2>
          
          <p>映像工房にご登録いただき、ありがとうございます！</p>
          
          <p>アカウントを有効化するために、下のボタンをクリックしてメールアドレスの認証を完了してください。</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="verification-button">
              📧 メールアドレスを認証する
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ 重要：</strong>
            <ul>
              <li>このリンクは24時間以内に有効期限が切れます</li>
              <li>認証が完了しないとアカウントは無効になります</li>
              <li>このメールに心当たりがない場合は、無視してください</li>
            </ul>
          </div>
          
          <p>ボタンがクリックできない場合は、以下のURLをブラウザにコピー&ペーストしてください：</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
            ${verificationUrl}
          </p>
          
          <p>映像工房をご利用いただき、ありがとうございます。<br>
          AI技術で素晴らしい動画を作成しましょう！</p>
        </div>
        
        <div class="footer">
          <p>© 2025 映像工房 - AI動画生成プラットフォーム</p>
          <p>このメールは自動送信されています。返信しないでください。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
映像工房へのご登録ありがとうございます！

メールアドレスの認証を完了するために、以下のリンクをクリックしてください：
${verificationUrl}

このリンクは24時間以内に有効期限が切れます。

映像工房チーム
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】メールアドレスの認証をお願いします 🎬',
    html,
    text
  });
}

// 発送密码重置邮件
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>パスワードリセット - 映像工房</title>
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
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 300;
        }
        .content {
          padding: 40px 30px;
        }
        .content h2 {
          color: #e60033;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .reset-button {
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
        .warning {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎬 映像工房</h1>
          <p>想像を映像に変える魔法</p>
        </div>
        
        <div class="content">
          <h2>🔐 パスワードのリセット</h2>
          
          <p>パスワードリセットのリクエストを受け付けました。</p>
          
          <p>新しいパスワードを設定するために、下のボタンをクリックしてください。</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              🔑 パスワードをリセットする
            </a>
          </div>
          
          <div class="warning">
            <strong>⚠️ セキュリティ上の注意：</strong>
            <ul>
              <li>このリンクは1時間以内に有効期限が切れます</li>
              <li>パスワードリセットを依頼していない場合は、このメールを無視してください</li>
              <li>アカウントのセキュリティに問題がある可能性があります</li>
            </ul>
          </div>
          
          <p>ボタンがクリックできない場合は、以下のURLをブラウザにコピー&ペーストしてください：</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
            ${resetUrl}
          </p>
        </div>
        
        <div class="footer">
          <p>© 2025 映像工房 - AI動画生成プラットフォーム</p>
          <p>このメールは自動送信されています。返信しないでください。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
映像工房 - パスワードリセット

パスワードリセットのリクエストを受け付けました。

新しいパスワードを設定するために、以下のリンクをクリックしてください：
${resetUrl}

このリンクは1時間以内に有効期限が切れます。

パスワードリセットを依頼していない場合は、このメールを無視してください。

映像工房チーム
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】パスワードリセットのお知らせ 🔐',
    html,
    text
  });
}

// 欢迎邮件（注册成功后发送）
export async function sendWelcomeEmail(email: string, userName?: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>映像工房へようこそ！</title>
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
        .feature {
          display: flex;
          align-items: center;
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }
        .feature-icon {
          font-size: 24px;
          margin-right: 15px;
        }
        .cta-button {
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
          <h1>🎬 映像工房へようこそ！</h1>
          <p>想像を映像に変える魔法が始まります</p>
        </div>
        
        <div class="content">
          <h2>🎉 登録完了おめでとうございます！</h2>
          
          <p>${userName ? `${userName}さん、` : ''}映像工房への登録が完了しました！</p>
          
          <p>AIの力を使って、あなたの想像力を美しい動画に変えてみませんか？</p>
          
          <h3>✨ 映像工房でできること：</h3>
          
          <div class="feature">
            <div class="feature-icon">🇯🇵</div>
            <div>
              <strong>日本語対応</strong><br>
              日本語でプロンプトを入力するだけで、自然な動画を生成
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">🖼️</div>
            <div>
              <strong>高品質画像対応</strong><br>
              お気に入りの画像をアップロードして、動画に変換
            </div>
          </div>
          
          <div class="feature">
            <div class="feature-icon">⚡</div>
            <div>
              <strong>高速処理</strong><br>
              最新のAI技術で、数分で高品質な動画を生成
            </div>
          </div>
          
          <p>🎁 <strong>特典：</strong> 新規登録者様には<strong>100クレジット</strong>をプレゼント！<br>
          約33本の動画を無料で生成できます。</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="cta-button">
              🚀 今すぐ動画を作成する
            </a>
          </div>
          
          <p>ご質問やサポートが必要な場合は、いつでもお気軽にお問い合わせください。</p>
          
          <p>素晴らしい動画作成体験をお楽しみください！</p>
        </div>
        
        <div class="footer">
          <p>© 2025 映像工房 - AI動画生成プラットフォーム</p>
          <p>お問い合わせ: ${process.env.SENDGRID_FROM_EMAIL}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '🎬【映像工房】ようこそ！AIで動画作成を始めましょう',
    html
  });
}

// 发送购买感谢邮件
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
      <title>【映像工房】ご購入ありがとうございます</title>
      <style>
        body {
          font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #e60033;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          color: #333;
          margin-bottom: 20px;
          border-bottom: 2px solid #e60033;
          padding-bottom: 10px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #555;
        }
        .purchase-details {
          background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);
          border: 2px solid #2196f3;
          border-radius: 15px;
          padding: 25px;
          margin: 25px 0;
        }
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
        }
        .detail-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
          font-size: 16px;
        }
        .detail-value {
          color: #e60033;
          font-weight: bold;
          font-size: 18px;
        }
        .highlight {
          background: linear-gradient(135deg, #fff9c4 0%, #fff3a0 100%);
          border: 2px solid #ffd700;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .highlight-text {
          font-size: 20px;
          font-weight: bold;
          color: #e60033;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          margin: 20px 0;
          color: #555;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #e60033, #ff6b7a);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          transition: all 0.3s ease;
        }
        .support-info {
          background: #f0f8ff;
          border: 1px solid #87ceeb;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎬 映像工房</div>
          <div class="title">ご購入ありがとうございます</div>
        </div>
        
        <div class="greeting">
          ${displayName}様
        </div>
        
        <div class="message">
          この度は映像工房をご利用いただき、誠にありがとうございます。<br>
          お客様のご購入が正常に完了いたしました。以下、ご購入内容をご確認ください。
        </div>
        
                 <div class="purchase-details">
           <div class="detail-item">
             <span class="detail-label">ご購入プラン</span>
             <span class="detail-value">${purchaseDetails.packageName}</span>
           </div>
           <div class="detail-item">
             <span class="detail-label">追加ポイント</span>
             <span class="detail-value">${purchaseDetails.credits.toLocaleString()} ポイント</span>
           </div>
           <div class="detail-item">
             <span class="detail-label">お支払い金額</span>
             <span class="detail-value">¥${purchaseDetails.amount.toLocaleString()}</span>
           </div>
           <div class="detail-item">
             <span class="detail-label">購入日時</span>
             <span class="detail-value">${purchaseDetails.purchaseDate}</span>
           </div>
           <div class="detail-item">
             <span class="detail-label">取引ID</span>
             <span class="detail-value">${purchaseDetails.sessionId}</span>
           </div>
         </div>
         
         <div class="highlight">
           <div class="highlight-text">
             ${purchaseDetails.credits.toLocaleString()}ポイントがアカウントに追加されました
           </div>
         </div>
        
                 <div class="message">
           <strong>ポイントについて：</strong><br>
           • 1つの動画生成には300ポイントが必要です<br>
           • ポイントに有効期限はございません<br>
           • 動画生成が失敗した場合、ポイントは自動的に返還されます<br>
           • 追加ポイントのご購入はいつでも可能です
         </div>
         
         <div style="text-align: center;">
           <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">
             動画作成を始める
           </a>
         </div>
         
         <div class="support-info">
           <strong>カスタマーサポート</strong><br>
           ご質問やお困りのことがございましたら、お気軽にカスタマーサポートまでお問い合わせください。<br>
           <strong>メール：</strong> support@eizokobo.com<br>
           <strong>営業時間：</strong> 平日 9:00-18:00 (土日祝日除く)
         </div>
        
        <div class="message">
          今後とも映像工房をよろしくお願いいたします。<br>
          素晴らしい動画作成をお楽しみください！
        </div>
        
        <div class="footer">
          <p>このメールは自動送信です。返信はできませんのでご了承ください。</p>
          <p>© 2024 映像工房. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: '【映像工房】ご購入ありがとうございます - ポイントが追加されました',
    html
  });
} 