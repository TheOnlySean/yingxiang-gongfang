import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('=== SENDGRID DEBUG API CALLED ===');
    console.log('SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY);
    console.log('SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length);
    console.log('SENDGRID_API_KEY starts with:', process.env.SENDGRID_API_KEY?.substring(0, 7));
    console.log('SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL);
    console.log('SENDGRID_FROM_NAME:', process.env.SENDGRID_FROM_NAME);

    // 设置 SendGrid API 密钥
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    // 尝试发送测试邮件
    const testMsg = {
      to: process.env.SENDGRID_FROM_EMAIL!, // 发送给自己
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: process.env.SENDGRID_FROM_NAME!
      },
      subject: 'SendGrid测试邮件 - 映像工房',
      html: `
        <h1>SendGrid 测试成功</h1>
        <p>这是一封来自映像工房的测试邮件。</p>
        <p>发送时间: ${new Date().toLocaleString('ja-JP')}</p>
      `,
      text: 'SendGrid 测试成功 - 映像工房'
    };

    console.log('Attempting to send test email...');
    console.log('Message config:', JSON.stringify(testMsg, null, 2));

    const result = await sgMail.send(testMsg);
    console.log('SendGrid send result:', result[0]?.statusCode);

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      config: {
        apiKeyPresent: !!process.env.SENDGRID_API_KEY,
        apiKeyLength: process.env.SENDGRID_API_KEY?.length,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        fromName: process.env.SENDGRID_FROM_NAME
      },
      statusCode: result[0]?.statusCode
    });

  } catch (error: any) {
    console.error('SendGrid debug error:', error);
    
    // 详细的错误信息
    const errorDetails = {
      message: error.message,
      code: error.code,
      statusCode: error.response?.statusCode,
      body: error.response?.body,
      headers: error.response?.headers
    };
    
    console.log('Detailed error:', JSON.stringify(errorDetails, null, 2));

    return NextResponse.json({
      success: false,
      error: 'SendGrid error',
      details: errorDetails,
      config: {
        apiKeyPresent: !!process.env.SENDGRID_API_KEY,
        apiKeyLength: process.env.SENDGRID_API_KEY?.length,
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
        fromName: process.env.SENDGRID_FROM_NAME
      }
    });
  }
} 