import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getVideoStatus } from '@/lib/video-generation';
import { dbAdmin } from '@/lib/database';
import { IApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // 认证用户
    const { user, error } = await authenticate(request);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error || 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }

    console.log(`Starting video recovery for user: ${user.id}`);

    // 查找用户的pending和processing视频
    const pendingVideosResult = await dbAdmin.getUserVideos(user.id, { status: 'pending' });
    const processingVideosResult = await dbAdmin.getUserVideos(user.id, { status: 'processing' });
    
    const incompleteVideos = [
      ...(pendingVideosResult || []),
      ...(processingVideosResult || [])
    ];
    
    if (!incompleteVideos || incompleteVideos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No incomplete videos found',
          recovered: 0,
          total: 0
        }
      });
    }

    console.log(`Found ${incompleteVideos.length} incomplete videos for user ${user.id} (${pendingVideosResult?.length || 0} pending, ${processingVideosResult?.length || 0} processing)`);

    const results = [];
    let recovered = 0;

    // 逐个检查每个incomplete视频
    for (const video of incompleteVideos) {
      try {
        console.log(`Checking video with taskId: ${video.taskId}`);
        
        // 查询KIE.AI状态
        const statusResult = await getVideoStatus(video.taskId);
        
        if (statusResult.success && statusResult.data) {
          console.log(`Successfully updated video: ${video.id}`);
          results.push({
            videoId: video.id,
            taskId: video.taskId,
            status: statusResult.data.status,
            videoUrl: statusResult.data.videoUrl || null,
            success: true
          });
          
          if (statusResult.data.status === 'completed') {
            recovered++;
          }
        } else {
          console.error(`Failed to get status for video ${video.id}:`, statusResult.error);
          results.push({
            videoId: video.id,
            taskId: video.taskId,
            status: 'failed',
            error: statusResult.error?.message || 'Unknown error',
            success: false
          });
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        results.push({
          videoId: video.id,
          taskId: video.taskId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    console.log(`Recovery completed. Recovered ${recovered} videos out of ${incompleteVideos.length}`);

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully processed ${incompleteVideos.length} videos, recovered ${recovered} completed videos`,
        total: incompleteVideos.length,
        recovered: recovered,
        results: results
      }
    });

  } catch (error) {
    console.error('Video recovery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RECOVERY_FAILED',
          message: error instanceof Error ? error.message : 'Recovery failed'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
} 