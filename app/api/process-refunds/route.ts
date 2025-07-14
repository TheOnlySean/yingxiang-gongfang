import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { processFailedVideoRefunds } from '@/lib/video-generation';

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
        },
        { status: 401 }
      );
    }

    console.log(`Processing refunds for user ${authResult.user.id}`);

    // 处理该用户的失败视频退款
    const result = await processFailedVideoRefunds(authResult.user.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          processedCount: result.processedCount,
          refundedCredits: result.refundedCredits,
          errors: result.errors,
          message: result.processedCount > 0 
            ? `Successfully processed ${result.processedCount} failed videos and refunded ${result.refundedCredits} credits`
            : 'No failed videos found that need refund processing'
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'PROCESSING_FAILED',
          message: 'Failed to process refunds',
          details: result.errors
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Process refunds API error:', error);
    
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