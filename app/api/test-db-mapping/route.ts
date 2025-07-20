import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, dbVideoToVideo } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId = '17' } = await request.json();
    
    console.log(`Testing database field mapping for user ${userId}`);

    // 获取用户信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // 获取用户的视频记录
    const videos = await dbAdmin.getUserVideos(userId, { limit: 5 });
    
    if (videos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No videos found for user'
      }, { status: 404 });
    }

    // 测试字段映射
    const testResults = videos.map(video => {
      const mappedVideo = dbVideoToVideo(video);
      
      // 测试退款条件
      const newStatus = 'failed';
      const needsRefundCheck = newStatus === 'failed' && video.credits_used > 0;
      const shouldRefund = needsRefundCheck && 
                          (video.status !== 'failed' || !video.error_message?.includes('返還'));

      return {
        videoId: video.id,
        taskId: video.task_id,
        // 数据库字段
        dbCreditsUsed: video.credits_used,
        dbStatus: video.status,
        dbErrorMessage: video.error_message,
        // 映射后字段
        mappedCreditsUsed: mappedVideo.creditsUsed,
        mappedStatus: mappedVideo.status,
        mappedErrorMessage: mappedVideo.errorMessage,
        // 退款条件测试
        needsRefundCheck,
        shouldRefund,
        refundConditionDetails: {
          newStatus,
          currentStatus: video.status,
          creditsUsed: video.credits_used,
          hasErrorMessage: !!video.error_message,
          errorMessageIncludesRefund: video.error_message?.includes('返還') || false
        }
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Database field mapping test completed',
      data: {
        userId,
        userCredits: user.credits,
        videosTested: testResults.length,
        testResults
      }
    });

  } catch (error) {
    console.error('Test database mapping error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 