import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getUserVideos } from '@/lib/video-generation';

export async function GET(request: NextRequest) {
  try {
    // 使用真实认证
    const authResult = await authenticate(request);
    if (!authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('Videos API called with:', { limit, offset });

    // 使用真实的数据库查询
    const result = await getUserVideos(authResult.user.id, {
      limit,
      offset
    });

    if (result.success && result.data) {
      return NextResponse.json({
        success: true,
        data: {
          videos: result.data.videos,
          total: result.data.total,
          totalVideoCount: result.data.total // 兼容前端
        }
      }, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }

  } catch (error) {
    console.error('Get user videos API error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 