import { dbAdmin } from './supabase';
import { translatePrompt } from './translation';
import { 
  IVideo, 
  IVideoGenerationForm, 
  IKieAiGenerateRequest, 
  IKieAiGenerateResponse, 
  IKieAiStatusResponse,
  IApiResponse, 
  API_ERROR_CODES,
  VideoStatus
} from '@/types';

// KIE.AI API配置
const KIE_AI_BASE_URL = process.env.KIE_AI_BASE_URL || 'https://api.kie.ai';
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY!;

if (!KIE_AI_API_KEY) {
  throw new Error('KIE_AI_API_KEY is required');
}

// 视频生成配置
const VIDEO_GENERATION_CONFIG = {
  MAX_PROMPT_LENGTH: 1000,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DEFAULT_CREDITS_COST: 150
};

// KIE.AI API客户端
class KieAiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  // 生成视频
  async generateVideo(request: IKieAiGenerateRequest): Promise<IKieAiGenerateResponse> {
    try {
      console.log('Calling KIE.AI API:', {
        url: `${this.baseUrl}/api/v1/veo/generate`,
        request: request
      });

      const response = await fetch(`${this.baseUrl}/api/v1/veo/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      console.log('KIE.AI API response status:', response.status);
      console.log('KIE.AI API response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('KIE.AI API response text:', responseText);

      if (!response.ok) {
        throw new Error(`KIE.AI API error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      // 尝试解析JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse KIE.AI response as JSON:', parseError);
        throw new Error(`Invalid JSON response from KIE.AI: ${responseText}`);
      }

      console.log('KIE.AI API parsed response:', data);
      
      // 适配KIE.AI的实际响应格式
      if (data.code === 200 && data.data && data.data.taskId) {
        return {
          taskId: data.data.taskId,
          status: 'success'
        };
      } else {
        throw new Error(`KIE.AI API error: ${data.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('KIE.AI generate video error:', error);
      throw error;
    }
  }

  // 查询视频状态
  async getVideoStatus(taskId: string): Promise<IKieAiStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/veo/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`KIE.AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('KIE.AI get video status error:', error);
      throw error;
    }
  }

  // 获取1080P视频
  async get1080PVideo(taskId: string): Promise<{ videoUrl: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/veo/1080p-video?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`KIE.AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('KIE.AI get 1080P video error:', error);
      throw error;
    }
  }
}

// 创建KIE.AI客户端实例
const kieAiClient = new KieAiClient(KIE_AI_BASE_URL, KIE_AI_API_KEY);

// 验证视频生成表单
export function validateVideoGenerationForm(form: IVideoGenerationForm): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 验证prompt
  if (!form.originalPrompt || form.originalPrompt.trim().length === 0) {
    errors.push('Prompt is required');
  }

  if (form.originalPrompt.length > VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH) {
    errors.push(`Prompt too long (max ${VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH} characters)`);
  }

  // 验证图片URL（如果提供）
  if (form.imageUrls && form.imageUrls.length > 0) {
    for (const url of form.imageUrls) {
      if (!url || typeof url !== 'string') {
        errors.push('Invalid image URL format');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 计算视频生成所需点数
export function calculateCreditsRequired(): number {
  return VIDEO_GENERATION_CONFIG.DEFAULT_CREDITS_COST;
}

// 检查用户是否有足够的点数
export async function checkUserCredits(
  userId: string,
  requiredCredits: number
): Promise<{ hasEnoughCredits: boolean; currentCredits: number }> {
  try {
    const user = await dbAdmin.getUserById(userId);
    
    if (!user) {
      return { hasEnoughCredits: false, currentCredits: 0 };
    }

    return {
      hasEnoughCredits: user.credits >= requiredCredits,
      currentCredits: user.credits
    };
  } catch (error) {
    console.error('Error checking user credits:', error);
    return { hasEnoughCredits: false, currentCredits: 0 };
  }
}

// 主要视频生成函数
export async function generateVideo(
  userId: string,
  form: IVideoGenerationForm
): Promise<IApiResponse<IVideo>> {
  try {
    // 验证表单
    const validation = validateVideoGenerationForm(form);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: validation.errors.join(', ')
        }
      };
    }

    // 计算所需点数
    const requiredCredits = calculateCreditsRequired();

    // 检查用户点数
    const creditCheck = await checkUserCredits(userId, requiredCredits);
    if (!creditCheck.hasEnoughCredits) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.INSUFFICIENT_CREDITS,
          message: 'Insufficient credits',
          details: {
            required: requiredCredits,
            current: creditCheck.currentCredits
          }
        }
      };
    }

    // 翻译prompt
    const translationResult = await translatePrompt(form.originalPrompt, {
      useCache: true,
      includeDialogue: true,
      addRomaji: true
    });

    if (!translationResult.success || !translationResult.data) {
      return {
        success: false,
        error: translationResult.error || {
          code: API_ERROR_CODES.TRANSLATION_FAILED,
          message: 'Failed to translate prompt'
        }
      };
    }

    // 构建KIE.AI请求
    const kieAiRequest: IKieAiGenerateRequest = {
      prompt: translationResult.data.translatedPrompt,
      model: 'veo3_fast' // 正確模型名稱
    };

    if (form.imageUrls && form.imageUrls.length > 0) {
      // 处理图片URL，确保KIE.AI可以访问
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
      kieAiRequest.imageUrls = form.imageUrls.map(url => {
        if (url.startsWith('/uploads/')) {
          // 本地存储的图片：从 /uploads/filename 转换为 完整的API URL
          const filename = url.replace('/uploads/', '');
          const fullUrl = `${baseUrl}/api/uploads/${filename}`;
          console.log(`Converting local image URL: ${url} -> ${fullUrl}`);
          return fullUrl;
        } else if (url.startsWith('https://') && url.includes('vercel-storage.com')) {
          // Vercel Blob 存储的图片：直接使用（已经是完整的公共URL）
          console.log(`Using Vercel Blob URL directly: ${url}`);
          return url;
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          // 其他外部URL：直接使用
          console.log(`Using external URL directly: ${url}`);
          return url;
        } else {
          // 其他情况：尝试构建完整URL
          const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
          console.log(`Converting relative URL: ${url} -> ${fullUrl}`);
          return fullUrl;
        }
      });
      
      console.log('Final image URLs for KIE.AI:', kieAiRequest.imageUrls);
    }

    // 如果有seed，添加到请求中
    if (form.seed && form.seed.trim()) {
      kieAiRequest.seed = form.seed.trim();
    }

    // 调用KIE.AI API
    const kieAiResponse = await kieAiClient.generateVideo(kieAiRequest);

    // 保存到数据库
    const videoData: any = {
      user_id: userId,
      original_prompt: form.originalPrompt,
      translated_prompt: translationResult.data.translatedPrompt,
      task_id: kieAiResponse.taskId,
      status: 'pending',
      credits_used: requiredCredits
    };

    if (form.imageUrls && form.imageUrls.length > 0) {
      videoData.image_urls = JSON.stringify(form.imageUrls);
    }

    const dbVideo = await dbAdmin.createVideo(videoData);
    
    // 扣除用户点数
    await dbAdmin.updateUser(userId, {
      credits: creditCheck.currentCredits - requiredCredits,
      videos_generated: (await dbAdmin.getUserById(userId))?.videos_generated + 1 || 1
    });

    // 构建返回的视频对象
    const video: IVideo = {
      id: dbVideo.id,
      userId: dbVideo.user_id,
      originalPrompt: dbVideo.original_prompt,
      translatedPrompt: dbVideo.translated_prompt,
      taskId: dbVideo.task_id,
      status: dbVideo.status as VideoStatus,
      imageUrls: dbVideo.image_urls ? (typeof dbVideo.image_urls === 'string' ? JSON.parse(dbVideo.image_urls) : dbVideo.image_urls) : undefined,
      creditsUsed: dbVideo.credits_used,
      createdAt: dbVideo.created_at,
      updatedAt: dbVideo.updated_at
    };

    return {
      success: true,
      data: video
    };

  } catch (error) {
    console.error('Video generation error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.GENERATION_FAILED,
        message: error instanceof Error ? error.message : 'Video generation failed'
      }
    };
  }
}

// 映射KIE.AI successFlag到我们的状态
function mapKieAiStatusToVideoStatus(successFlag: 0 | 1): VideoStatus {
  switch (successFlag) {
    case 0: return 'processing'; // 处理中或失败
    case 1: return 'completed';  // 成功
    default: return 'failed';
  }
}

// 查询视频状态
export async function getVideoStatus(taskId: string): Promise<IApiResponse<IVideo>> {
  try {
    console.log(`Getting video status for taskId: ${taskId}`);
    
    // 查询KIE.AI状态
    const kieAiStatus = await kieAiClient.getVideoStatus(taskId);
    console.log('KIE.AI status response:', JSON.stringify(kieAiStatus, null, 2));
    
    // 查找数据库中的视频记录
    const dbVideo = await dbAdmin.getVideoByTaskId(taskId);
    if (!dbVideo) {
      console.log(`No video found in database for taskId: ${taskId}`);
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'Video not found'
        }
      };
    }

    // 准备更新数据
    const updates: any = {};
    
    // 根据KIE.AI的实际响应格式判断状态
    let newStatus = 'failed';
    if (kieAiStatus.data && kieAiStatus.data.successFlag === 1) {
      newStatus = 'completed';
      console.log('Video generation completed successfully');
    } else if (kieAiStatus.data && kieAiStatus.data.successFlag === 0) {
      newStatus = 'processing';
      console.log('Video generation still in progress');
    } else {
      console.log('Video generation failed');
    }
    
    // 更新状态
    if (newStatus !== dbVideo.status) {
      updates.status = newStatus;
    }
    
    // 处理视频URL（从response.resultUrls数组中获取）
    if (kieAiStatus.data && kieAiStatus.data.response && kieAiStatus.data.response.resultUrls && kieAiStatus.data.response.resultUrls.length > 0) {
      const videoUrl = kieAiStatus.data.response.resultUrls[0];
      if (videoUrl && !dbVideo.video_url) {
        updates.video_url = videoUrl;
        console.log(`Found video URL: ${videoUrl}`);
      }
    }
    
    // 设置完成时间
    if (newStatus === 'completed' && !dbVideo.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    
    // 处理错误信息
    if (newStatus === 'failed' && kieAiStatus.data && kieAiStatus.data.errorMessage && !dbVideo.error_message) {
      updates.error_message = kieAiStatus.data.errorMessage;
    }
    
    // 处理退款逻辑（当生成失败时）
    let refundApplied = false;
    if (newStatus === 'failed' && (dbVideo.status === 'pending' || dbVideo.status === 'processing')) {
      try {
        // 获取用户当前信息
        const user = await dbAdmin.getUserById(dbVideo.user_id);
        if (user && dbVideo.credits_used > 0) {
          // 退还credits并减少生成次数
          const refundCredits = dbVideo.credits_used;
          await dbAdmin.updateUser(dbVideo.user_id, {
            credits: user.credits + refundCredits,
            videos_generated: Math.max(0, user.videos_generated - 1)
          });
          
          refundApplied = true;
          console.log(`Refunded ${refundCredits} credits to user ${dbVideo.user_id} for failed generation. Task: ${dbVideo.task_id}`);
        }
      } catch (refundError) {
        console.error('Failed to process refund:', refundError);
        // 继续执行，不要因为退款失败而中断状态更新
      }
    }
    
    // 如果有更新，保存到数据库
    let updatedVideo = dbVideo;
    if (Object.keys(updates).length > 0) {
      console.log('Updating video in database:', updates);
      if (refundApplied) {
        console.log(`Applied refund for failed generation: ${dbVideo.credits_used} credits`);
      }
      updatedVideo = await dbAdmin.updateVideo(dbVideo.id, updates);
      if (!updatedVideo) {
        throw new Error('Failed to update video in database');
      }
    }

    // 构建返回的视频对象
    const video: IVideo = {
      id: updatedVideo.id,
      userId: updatedVideo.user_id,
      originalPrompt: updatedVideo.original_prompt,
      translatedPrompt: updatedVideo.translated_prompt,
      taskId: updatedVideo.task_id,
      status: updatedVideo.status as VideoStatus,
      videoUrl: updatedVideo.video_url || undefined,
      thumbnailUrl: updatedVideo.thumbnail_url || undefined,
      imageUrls: updatedVideo.image_urls ? (typeof updatedVideo.image_urls === 'string' ? JSON.parse(updatedVideo.image_urls) : updatedVideo.image_urls) : undefined,
      creditsUsed: updatedVideo.credits_used,
      errorMessage: updatedVideo.error_message || undefined,
      // 计算KIE.AI的过期时间（14天）
      kieAiExpiresAt: new Date(new Date(updatedVideo.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      localExpiresAt: new Date(new Date(updatedVideo.created_at).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      storageStatus: 'kie_ai_only',
      createdAt: updatedVideo.created_at,
      updatedAt: updatedVideo.updated_at,
      completedAt: updatedVideo.completed_at || undefined
    };

    return {
      success: true,
      data: video
    };

  } catch (error) {
    console.error('Get video status error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to get video status'
      }
    };
  }
}

// 获取用户的视频历史
export async function getUserVideos(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    status?: VideoStatus;
  } = {}
): Promise<IApiResponse<{ videos: IVideo[]; total: number }>> {
  try {
    const { limit = 10, offset = 0 } = options;
    
    const dbOptions: { limit: number; offset: number; status?: string } = { limit, offset };
    if (options.status) {
      dbOptions.status = options.status;
    }
    const result = await dbAdmin.getUserVideos(userId, dbOptions);
    
    const processedVideos: IVideo[] = result.videos.map((video: any) => {
      // 计算KIE.AI的过期时间（14天）
      const createdDate = new Date(video.created_at);
      const kieAiExpiresAt = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      
      return {
        id: video.id,
        userId: video.user_id,
        originalPrompt: video.original_prompt,
        translatedPrompt: video.translated_prompt,
        taskId: video.task_id,
        status: video.status as VideoStatus,
        videoUrl: video.video_url || undefined,
        thumbnailUrl: video.thumbnail_url || undefined,
        imageUrls: video.image_urls ? (typeof video.image_urls === 'string' ? JSON.parse(video.image_urls) : video.image_urls) : undefined,
        creditsUsed: video.credits_used,
        errorMessage: video.error_message || undefined,
        // 过期时间管理
        kieAiExpiresAt: kieAiExpiresAt.toISOString(),
        localExpiresAt: kieAiExpiresAt.toISOString(), // 目前与KIE.AI相同
        storageStatus: 'kie_ai_only', // 默认只在KIE.AI存储
        createdAt: video.created_at,
        updatedAt: video.updated_at,
        completedAt: video.completed_at || undefined
      };
    });

    return {
      success: true,
      data: {
        videos: processedVideos,
        total: result.total
      }
    };

  } catch (error) {
    console.error('Get user videos error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to get user videos'
      }
    };
  }
}

// 删除视频
export async function deleteVideo(
  videoId: string,
  userId: string
): Promise<IApiResponse<{}>> {
  try {
    const video = await dbAdmin.getVideoById(videoId);
    
    if (!video) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'Video not found'
        }
      };
    }

    // 检查视频是否属于该用户
    if (video.user_id !== userId) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.FORBIDDEN,
          message: 'Access denied'
        }
      };
    }

    // 这里可以添加删除逻辑
    // 注意：实际项目中可能需要软删除而不是硬删除
    
    return {
      success: true,
      data: {}
    };

  } catch (error) {
    console.error('Delete video error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to delete video'
      }
    };
  }
}

// 重新生成视频
export async function regenerateVideo(
  videoId: string,
  userId: string
): Promise<IApiResponse<IVideo>> {
  try {
    const video = await dbAdmin.getVideoById(videoId);
    
    if (!video) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'Video not found'
        }
      };
    }

    // 检查视频是否属于该用户
    if (video.user_id !== userId) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.FORBIDDEN,
          message: 'Access denied'
        }
      };
    }

    // 使用原始参数重新生成
    const form: IVideoGenerationForm = {
      originalPrompt: video.original_prompt,
      imageUrls: video.image_urls ? (typeof video.image_urls === 'string' ? JSON.parse(video.image_urls) : video.image_urls) : undefined
    };

    return await generateVideo(userId, form);

  } catch (error) {
    console.error('Regenerate video error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to regenerate video'
      }
    };
  }
}

// 批量更新视频状态（用于定时任务）
export async function batchUpdateVideoStatus(
  limit: number = 50
): Promise<void> {
  try {
    console.log(`Starting batch video status update (limit: ${limit})...`);
    
    // 这里需要实现批量更新逻辑
    // 获取所有pending和processing状态的视频
    // 逐个查询状态并更新
    
    console.log('Batch video status update completed');
    
  } catch (error) {
    console.error('Batch update video status error:', error);
  }
}

// 导出配置和客户端
export { VIDEO_GENERATION_CONFIG, kieAiClient }; 

// 处理历史失败视频的退款
export async function processFailedVideoRefunds(userId?: string): Promise<{
  success: boolean;
  processedCount: number;
  refundedCredits: number;
  errors: string[];
}> {
  try {
    console.log('Processing failed video refunds...');
    
    let processedCount = 0;
    let refundedCredits = 0;
    const errors: string[] = [];

    // 获取用户的视频并过滤失败的视频
    if (!userId) {
      throw new Error('User ID is required for refund processing');
    }
    
    const videosResult = await getUserVideos(userId, { limit: 100 }); // 获取更多视频
    if (!videosResult.success || !videosResult.data) {
      throw new Error('Failed to get user videos');
    }
    
    // 过滤出失败且可能需要退款的视频
    const failedVideos = videosResult.data.videos.filter(video => 
      video.status === 'failed'
    );
    
    if (failedVideos.length > 0) {
      console.log(`Found ${failedVideos.length} failed videos to check for refund processing`);
      
      for (const video of failedVideos) {
        try {
          // 获取用户信息
          const user = await dbAdmin.getUserById(video.userId);
          if (user && video.creditsUsed > 0) {
            // 退还credits并减少生成次数
            await dbAdmin.updateUser(video.userId, {
              credits: user.credits + video.creditsUsed,
              videos_generated: Math.max(0, user.videos_generated - 1)
            });
            
            // 标记已退款（暂时跳过，因为需要更新数据库结构）
            // await dbAdmin.updateVideo(video.id, {
            //   refund_processed: true
            // });
            
            processedCount++;
            refundedCredits += video.creditsUsed;
            
            console.log(`Refunded ${video.creditsUsed} credits to user ${video.userId} for failed video ${video.taskId}`);
          }
        } catch (error) {
          const errorMsg = `Failed to process refund for video ${video.taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    } else {
      console.log('No failed videos found that need refund processing');
    }

    return {
      success: true,
      processedCount,
      refundedCredits,
      errors
    };

  } catch (error) {
    console.error('Error processing failed video refunds:', error);
    return {
      success: false,
      processedCount: 0,
      refundedCredits: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
} 