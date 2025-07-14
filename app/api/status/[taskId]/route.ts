import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getVideoStatus } from '@/lib/video-generation';
import { IApiResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
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

    const { taskId } = params;

    // 验证taskId
    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Task ID is required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 移除测试模式 - 直接使用真实KIE.AI API

    // 生产模式：使用真实API
    const result = await getVideoStatus(taskId);

    if (result.success) {
      // 检查视频是否属于当前用户
      if (result.data && result.data.userId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Access denied'
            }
          } as IApiResponse,
          { status: 403 }
        );
      }

      return NextResponse.json(result, { status: 200 });
    } else {
      const statusCode = result.error?.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

  } catch (error) {
    console.error('Get video status API error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 