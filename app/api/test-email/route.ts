import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

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

    const { type } = await request.json();
    
    console.log('=== EMAIL TEST API CALLED ===');
    console.log('SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length);
    console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
    console.log('SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME);

    // 测试不同类型的邮件
    switch (type) {
      case 'purchase':
        // 模拟购买感谢邮件
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
        
        const purchaseMsg = {
          to: decoded.email,
          from: {
            email: process.env.SENDGRID_FROM_EMAIL!,
            name: process.env.SENDGRID_FROM_NAME!
          },
          subject: '【映像工房】テストメール - ご購入ありがとうございます',
          html: `
            <h1>🎬 映像工房</h1>
            <p>これはテストメールです。</p>
            <p>SendGrid設定が正常に動作しています。</p>
            <p>模擬購買詳細：</p>
            <ul>
              <li>プラン: スタータープラン</li>
              <li>ポイント: 1000ポイント</li>
              <li>金額: ¥750</li>
            </ul>
            <p>このメールが届いたら、SendGrid設定は正常です。</p>
          `
        };
        
        try {
          await sgMail.send(purchaseMsg);
          console.log('✅ Test email sent successfully');
          return NextResponse.json({ 
            success: true, 
            message: 'Test email sent successfully' 
          });
        } catch (error) {
          console.error('❌ Test email failed:', error);
          return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
          }, { status: 500 });
        }
        break;
        
      default:
        return NextResponse.json({ 
          error: 'Invalid email type. Use: purchase' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Test email API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Email test endpoint',
    usage: 'POST with { type: "purchase" } and Authorization header'
  });
} 