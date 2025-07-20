import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { userId, taskId, refundAmount, reason } = await request.json();

    // 验证参数
    if (!userId || !taskId || !refundAmount || refundAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters or invalid refund amount'
      }, { status: 400 });
    }

    // 获取用户当前信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // 查找相关的视频记录
    const video = await dbAdmin.getVideoByTaskId(taskId);
    if (!video) {
      return NextResponse.json({
        success: false,
        error: 'Video record not found'
      }, { status: 404 });
    }

    // 记录退款前状态
    const beforeCredits = user.credits;
    console.log(`Emergency refund initiated:`);
    console.log(`  - User ID: ${userId}`);
    console.log(`  - Task ID: ${taskId}`);
    console.log(`  - Before credits: ${beforeCredits}`);
    console.log(`  - Refund amount: ${refundAmount}`);
    console.log(`  - Reason: ${reason}`);

    // 执行退款
    const updateResult = await dbAdmin.update(userId, {
      credits: beforeCredits + refundAmount,
      videosGenerated: Math.max(0, user.videosGenerated - 1)
    });

    if (!updateResult) {
      throw new Error('Failed to update user credits');
    }

    // 验证退款
    const updatedUser = await dbAdmin.findById(userId);
    if (!updatedUser) {
      throw new Error('Failed to verify refund');
    }

    console.log(`Emergency refund completed:`);
    console.log(`  - After credits: ${updatedUser.credits}`);
    console.log(`  - Credits difference: ${updatedUser.credits - beforeCredits}`);

    // 更新视频状态为失败
    await dbAdmin.updateVideo(video.id, {
      status: 'failed',
      error_message: `生成失败により${refundAmount}ポイントを返還しました。`
    });

    // 发送确认邮件给管理员
    try {
      await sendEmail({
        to: 'angelsphoto99@gmail.com',
        subject: '緊急退款処理完了',
        html: `
          <h2>緊急退款処理が完了しました</h2>
          <p><strong>処理時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Task ID:</strong> ${taskId}</p>
          <p><strong>退款前のクレジット:</strong> ${beforeCredits}</p>
          <p><strong>退款金額:</strong> ${refundAmount}ポイント</p>
          <p><strong>退款後のクレジット:</strong> ${updatedUser.credits}</p>
          <p><strong>理由:</strong> ${reason || '緊急処理'}</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send refund confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        taskId,
        beforeCredits,
        afterCredits: updatedUser.credits,
        refundAmount,
        message: `Successfully refunded ${refundAmount} credits to user ${userId}`
      }
    });

  } catch (error) {
    console.error('Emergency refund failed:', error);
    
    // 发送失败通知
    try {
      await sendEmail({
        to: 'angelsphoto99@gmail.com',
        subject: '【エラー】緊急退款処理失敗',
        html: `
          <h2 style="color: red;">緊急退款処理が失敗しました</h2>
          <p><strong>エラー時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
          <p><strong>エラー詳細:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>手動での確認と対応が必要です。</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send error notification:', emailError);
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
 