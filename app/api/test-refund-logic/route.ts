import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId = '17' } = await request.json();
    
    console.log(`Testing refund logic for user ${userId}`);

    // 获取用户当前信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    console.log(`User ${userId} current credits: ${user.credits}`);

    // 获取用户的失败视频
    const videos = await dbAdmin.getUserVideos(userId, { limit: 10 });
    const failedVideos = videos.filter(video => video.status === 'failed');

    console.log(`Found ${failedVideos.length} failed videos`);

    // 测试退款逻辑
    const refundResults = [];
    for (const video of failedVideos) {
      // 模拟getVideoStatus中的退款逻辑
      const newStatus = 'failed';
      const needsRefundCheck = newStatus === 'failed' && video.credits_used > 0;
      const shouldRefund = needsRefundCheck && 
                          (video.status !== 'failed' || !video.error_message?.includes('返還'));

      refundResults.push({
        videoId: video.id,
        taskId: video.task_id,
        creditsUsed: video.credits_used,
        status: video.status,
        errorMessage: video.error_message,
        needsRefundCheck,
        shouldRefund,
        hasRefundMessage: video.error_message?.includes('返還') || false
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Refund logic test completed',
      data: {
        userId,
        userCredits: user.credits,
        failedVideosCount: failedVideos.length,
        refundResults
      }
    });

  } catch (error) {
    console.error('Test refund logic error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 