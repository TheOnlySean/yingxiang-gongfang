import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { translatePrompt } from '@/lib/translation';
import { IApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 认证用户
    const { user, error } = await authenticate(request);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error || 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { originalPrompt, includeDialogue = true, addRomaji = true } = body;

    // 验证必填字段
    if (!originalPrompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Original prompt is required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 执行翻译
    const result = await translatePrompt(originalPrompt, {
      useCache: true,
      includeDialogue,
      addRomaji
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

  } catch (error) {
    console.error('Translate API error:', error);
    
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