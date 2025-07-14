import { NextRequest, NextResponse } from 'next/server';
import { validateEmail, createRateLimiter } from '@/lib/auth';
import { dbAdmin } from '@/lib/database';
import { IApiResponse } from '@/types';
import crypto from 'crypto';

// 忘记密码请求的速率限制：每个IP每小时最多5次请求
const forgotPasswordRateLimiter = createRateLimiter(5, 60 * 60 * 1000);

// 生成重置令牌
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// 发送重置密码邮件（暂时只是日志，实际需要集成邮件服务）
async function sendResetPasswordEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    // TODO: 集成实际的邮件服务 (SendGrid, Amazon SES等)
    // 这里先只记录日志，后续需要实现真实的邮件发送
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    
    console.log('📧 Password reset email would be sent:');
    console.log(`To: ${email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Token: ${resetToken}`);
    
    // 暂时返回true，实际实现时需要处理邮件发送结果
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP地址用于速率限制
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // 检查速率限制
    if (!forgotPasswordRateLimiter(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts. Please try again later.'
          }
        } as IApiResponse,
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { email } = body;

    // 验证必填字段
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email is required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 查找用户
    const user = await dbAdmin.getUserByEmail(email.toLowerCase());

    // 即使用户不存在，也返回成功信息（安全考虑，不泄露用户是否存在）
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'If this email exists in our system, you will receive a password reset link.'
          }
        } as IApiResponse,
        { status: 200 }
      );
    }

    // 生成重置令牌和过期时间（1小时后过期）
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1小时后过期

    // 更新用户的重置令牌
    const updatedUser = await dbAdmin.updateUser(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires.toISOString()
    });

    if (!updatedUser) {
      console.error('Error updating reset token');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to generate reset token'
          }
        } as IApiResponse,
        { status: 500 }
      );
    }

    // 发送重置密码邮件
    const emailSent = await sendResetPasswordEmail(email, resetToken);

    if (!emailSent) {
      console.error('Failed to send reset email');
      // 即使邮件发送失败，也不向用户暴露具体错误
      return NextResponse.json(
        {
          success: true,
          data: {
            message: 'If this email exists in our system, you will receive a password reset link.'
          }
        } as IApiResponse,
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'If this email exists in our system, you will receive a password reset link.'
        }
      } as IApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 