import { NextRequest, NextResponse } from 'next/server';
import { loginUser, validateEmail, loginRateLimiter } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt:', { email, password });

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required'
          }
        },
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
        },
        { status: 400 }
      );
    }

    // 速率限制检查
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!loginRateLimiter(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again later.'
          }
        },
        { status: 429 }
      );
    }

    // 使用真实认证
    const result = await loginUser(email, password);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      let statusCode = 500;
      
      switch (result.error?.code) {
        case 'VALIDATION_ERROR':
          statusCode = 400;
          break;
        case 'UNAUTHORIZED':
          statusCode = 401;
          break;
        case 'FORBIDDEN':
          statusCode = 403;
          break;
        default:
          statusCode = 500;
      }
      
      return NextResponse.json(result, { status: statusCode });
    }

  } catch (error) {
    console.error('Login API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      },
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