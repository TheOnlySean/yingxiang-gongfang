import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { batchUpdatePendingVideos } from '@/lib/video-generation';
import { IApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticate(request);
    
    if (!authResult.user) {
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

    console.log(`User ${authResult.user.id} triggered batch update of pending videos`);
    
    // 执行批量更新
    const result = await batchUpdatePendingVideos();
    
    return NextResponse.json({
      success: true,
      data: result
    } as IApiResponse, { status: 200 });

  } catch (error) {
    console.error('Batch update API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to perform batch update'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
} 