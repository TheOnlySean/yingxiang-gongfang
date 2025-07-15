import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { 
  sendWelcomeEmail, 
  sendPurchaseThankYouEmail, 
  sendPasswordResetEmail,
  sendSecurityAlertEmail,
  sendVerificationEmail,
  generateVerificationToken
} from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { emailType } = await request.json();
    
    console.log('=== 邮件测试 API 调用 ===');
    console.log('邮件类型:', emailType);
    console.log('用户邮箱:', decoded.email);

    let emailSent = false;
    let emailDescription = '';

    switch (emailType) {
      case 'welcome':
        emailSent = await sendWelcomeEmail(decoded.email, '田中太郎');
        emailDescription = '欢迎邮件';
        break;

      case 'purchase':
        emailSent = await sendPurchaseThankYouEmail(decoded.email, '田中太郎', {
          packageName: 'スタータープラン',
          credits: 1000,
          amount: 750,
          sessionId: 'cs_test_123456789',
          purchaseDate: new Date().toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
          })
        });
        emailDescription = '購入感謝邮件';
        break;

      case 'password-reset':
        emailSent = await sendPasswordResetEmail(decoded.email, 'test-reset-token-123');
        emailDescription = 'パスワードリセット邮件';
        break;



      case 'security-alert':
        emailSent = await sendSecurityAlertEmail(decoded.email, '田中太郎', {
          alertType: '新しいデバイスからのログイン',
          ipAddress: '192.168.1.100',
          location: '東京都, 日本',
          timestamp: new Date().toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
          }),
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        emailDescription = 'セキュリティ警告';
        break;

      case 'verification':
        const verificationToken = generateVerificationToken();
        emailSent = await sendVerificationEmail(decoded.email, verificationToken);
        emailDescription = 'メール認証';
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid email type. Options: welcome, purchase, password-reset, security-alert, verification' 
        }, { status: 400 });
    }

    if (emailSent) {
      console.log(`✅ ${emailDescription}邮件发送成功`);
      return NextResponse.json({ 
        success: true, 
        message: `${emailDescription}邮件发送成功`,
        emailType,
        recipient: decoded.email
      });
    } else {
      console.error(`❌ ${emailDescription}邮件发送失败`);
      return NextResponse.json({ 
        success: false, 
        error: `${emailDescription}邮件发送失败`,
        emailType,
        recipient: decoded.email
      }, { status: 500 });
    }

  } catch (error) {
    console.error('邮件测试 API 错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 