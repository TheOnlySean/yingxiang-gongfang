import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId = '17' } = await request.json();
    
    console.log(`Triggering refund for user ${userId}`);

    // 获取用户当前信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // 获取用户的失败视频
    const videos = await dbAdmin.getUserVideos(userId, { limit: 10 });
    const failedVideos = videos.filter(video => 
      video.status === 'failed' && 
      video.credits_used > 0 && 
      !video.error_message?.includes('返還')
    );

    console.log(`Found ${failedVideos.length} failed videos that need refund`);

    const refundResults = [];
    let totalRefunded = 0;

    for (const video of failedVideos) {
      try {
        // 执行退款
        const beforeCredits = user.credits;
        const refundCredits = video.credits_used;

        await dbAdmin.update(userId, {
          credits: beforeCredits + refundCredits,
          videosGenerated: Math.max(0, (user.videosGenerated || 0) - 1)
        });

        // 更新视频错误消息
        await dbAdmin.updateVideo(video.id, {
          error_message: `${video.error_message || '動画生成に失敗しました。'} (${refundCredits}ポイントを返還しました)`
        });

        totalRefunded += refundCredits;

        refundResults.push({
          videoId: video.id,
          taskId: video.task_id,
          creditsRefunded: refundCredits,
          success: true
        });

        console.log(`✅ Refunded ${refundCredits} credits for video ${video.task_id}`);

      } catch (error) {
        console.error(`❌ Failed to refund video ${video.task_id}:`, error);
        refundResults.push({
          videoId: video.id,
          taskId: video.task_id,
          creditsRefunded: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 获取最终用户信息
    const finalUser = await dbAdmin.findById(userId);
    if (!finalUser) {
      throw new Error('Failed to get final user state');
    }

    return NextResponse.json({
      success: true,
      message: 'Refund triggered successfully',
      data: {
        userId,
        initialCredits: user.credits,
        finalCredits: finalUser.credits,
        totalRefunded,
        videosProcessed: failedVideos.length,
        refundResults
      }
    });

  } catch (error) {
    console.error('Trigger refund error:', error);
    return NextResponse.json({
      success: false,
      error: 'Refund failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 