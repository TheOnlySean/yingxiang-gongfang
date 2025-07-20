import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { userId = '17' } = await request.json();
    
    console.log(`Testing refund flow for user ${userId}`);

    // 获取用户当前信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    console.log(`User ${userId} current credits: ${user.credits}`);

    // 模拟视频生成失败的情况
    // 1. 扣除积分
    const requiredCredits = 300;
    await dbAdmin.update(userId, {
      credits: user.credits - requiredCredits,
      videosGenerated: (user.videosGenerated || 0) + 1
    });

    // 2. 创建视频记录
    const uniqueTaskId = `test-task-${Date.now()}`;
    const videoData = {
      userId: userId,
      originalPrompt: 'テスト用プロンプト',
      translatedPrompt: 'Test prompt',
      taskId: uniqueTaskId,
      status: 'pending',
      creditsUsed: requiredCredits
    };

    const dbVideo = await dbAdmin.createVideo(videoData);
    console.log(`Created video record: ${dbVideo.id}`);

    // 3. 模拟API失败，更新状态为failed
    await dbAdmin.updateVideo(dbVideo.id, {
      status: 'failed',
      error_message: 'コンテンツポリシーに違反しています。'
    });

    console.log(`Updated video ${dbVideo.id} status to failed`);

    // 4. 退还积分
    const currentUser = await dbAdmin.findById(userId);
    if (!currentUser) {
      throw new Error('User not found during refund');
    }
    await dbAdmin.update(userId, {
      credits: currentUser.credits + requiredCredits,
      videosGenerated: Math.max(0, (currentUser.videosGenerated || 0) - 1)
    });

    // 5. 验证结果
    const finalUser = await dbAdmin.findById(userId);
    const finalVideo = await dbAdmin.getVideoByTaskId(uniqueTaskId);

    if (!finalUser) {
      throw new Error('Failed to verify final user state');
    }

    console.log(`Refund completed:`);
    console.log(`  - Final credits: ${finalUser.credits}`);
    console.log(`  - Expected credits: ${user.credits}`);
    console.log(`  - Video status: ${finalVideo?.status || 'unknown'}`);
    console.log(`  - Video error message: ${finalVideo?.error_message || 'none'}`);

    return NextResponse.json({
      success: true,
      message: 'Refund flow test completed',
      data: {
        initialCredits: user.credits,
        finalCredits: finalUser.credits,
        refundAmount: requiredCredits,
        videoStatus: finalVideo.status,
        videoErrorMessage: finalVideo.error_message,
        creditsRefunded: finalUser.credits === user.credits
      }
    });

  } catch (error) {
    console.error('Test refund flow error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 