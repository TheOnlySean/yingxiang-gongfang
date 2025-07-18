import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { generateVideo } from '@/lib/video-generation';
import { IApiResponse, IVideoGenerationForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 获取token并支持测试模式
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let user = null;
    
    // 使用真实认证
    const authResult = await authenticate(request);
    user = authResult.user;
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { originalPrompt, imageUrls } = body;

    // 构建表单数据
    const form: IVideoGenerationForm = {
      originalPrompt,
      imageUrls
    };

    // 移除测试模式 - 直接使用真实KIE.AI API

    // 生产模式：使用真实API
    const result = await generateVideo(user.id, form);

    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      let statusCode = 500;
      
      switch (result.error?.code) {
        case 'VALIDATION_ERROR':
          statusCode = 400;
          break;
        case 'INSUFFICIENT_CREDITS':
          statusCode = 402;
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
    console.error('Generate video API error:', error);
    
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