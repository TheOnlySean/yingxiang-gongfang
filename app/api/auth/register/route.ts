import { NextRequest, NextResponse } from 'next/server';
import { registerUser, validateEmail, validatePassword, registerRateLimiter } from '@/lib/auth';
import { IApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP地址用于速率限制
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // 检查速率限制
    if (!registerRateLimiter(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many registration attempts. Please try again later.'
          }
        } as IApiResponse,
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { email, password, confirmPassword } = body;

    // 验证必填字段
    if (!email || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, and confirm password are required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Passwords do not match'
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

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password does not meet requirements',
            details: {
              errors: passwordValidation.errors
            }
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 注册用户
    const result = await registerUser(email, password);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      const statusCode = result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

  } catch (error) {
    console.error('Register API error:', error);
    
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