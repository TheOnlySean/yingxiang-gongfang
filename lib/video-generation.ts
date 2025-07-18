import { dbAdmin, dbVideoToVideo } from './database';
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
  MAX_PROMPT_LENGTH: 6000,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DEFAULT_CREDITS_COST: 300
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
      const response = await fetch(`${this.baseUrl}/api/v1/veo/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error('❌ KIE.AI API error:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText
        });
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
  } else if (form.originalPrompt.length > VIDEO_GENERATION_CONFIG.MAX_PROMPT_LENGTH) {
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
    const user = await dbAdmin.findById(userId);
    
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
  let deductedCredits = 0;
  
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
      addRomaji: true,
      templateId: form.templateId as any // 传入模板ID
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

    // 应用场景模板增强
    let finalPrompt = translationResult.data.translatedPrompt;
    
    if (form.templateId) {
      const { combinePromptWithScene } = await import('./translation');
      finalPrompt = await combinePromptWithScene(translationResult.data.translatedPrompt, form.templateId as any);
    }

    // 构建KIE.AI请求
    const kieAiRequest: IKieAiGenerateRequest = {
      prompt: finalPrompt, // 使用增强后的prompt
      model: 'veo3_fast' // 正確模型名稱
    };

    if (form.imageUrls && form.imageUrls.length > 0) {
      // 处理图片URL，确保KIE.AI可以访问
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
      
      kieAiRequest.imageUrls = form.imageUrls.map((url) => {
        if (url.startsWith('/uploads/')) {
          // 本地存储的图片：从 /uploads/filename 转换为 完整的API URL
          const filename = url.replace('/uploads/', '');
          return `${baseUrl}/api/uploads/${filename}`;
        } else if (url.startsWith('https://') && url.includes('vercel-storage.com')) {
          // Vercel Blob 存储的图片：直接使用（已经是完整的公共URL）
          return url;
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          // 其他外部URL：直接使用
          return url;
        } else {
          // 其他情况：尝试构建完整URL
          return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
        }
      });
      
      // 验证URL格式
      const invalidUrls = kieAiRequest.imageUrls.filter(url => !url.startsWith('http'));
      if (invalidUrls.length > 0) {
        console.error('❌ Invalid URLs found:', invalidUrls);
        throw new Error(`Invalid image URLs: ${invalidUrls.join(', ')}`);
      }
    }

    // 如果有seed，添加到请求中
    if (form.seed && form.seed.trim()) {
      kieAiRequest.seed = form.seed.trim();
    }

    // 先扣除用户点数
    const currentUser = await dbAdmin.findById(userId);
    await dbAdmin.update(userId, {
      credits: creditCheck.currentCredits - requiredCredits,
      videosGenerated: (currentUser?.videosGenerated || 0) + 1
    });
    deductedCredits = requiredCredits;

    // 调用KIE.AI API
    const kieAiResponse = await kieAiClient.generateVideo(kieAiRequest);

    // 保存到数据库
    const videoData: any = {
      userId: userId,
      originalPrompt: form.originalPrompt,
      translatedPrompt: translationResult.data.translatedPrompt,
      taskId: kieAiResponse.taskId,
      status: 'pending',
      creditsUsed: requiredCredits
    };

    if (form.imageUrls && form.imageUrls.length > 0) {
      videoData.imageUrls = JSON.stringify(form.imageUrls);
    }

    const dbVideo = await dbAdmin.createVideo(videoData);
    
    // 使用转换函数构建返回的视频对象
    const video: IVideo = dbVideoToVideo(dbVideo);

    return {
      success: true,
      data: video
    };

  } catch (error) {
    console.error('Video generation error:', error);
    
    // 如果已经扣除了积分，需要退还
    if (deductedCredits > 0) {
      try {
        console.log(`Refunding ${deductedCredits} credits to user ${userId} due to generation failure`);
        const currentUser = await dbAdmin.findById(userId);
        if (currentUser) {
          await dbAdmin.update(userId, {
            credits: currentUser.credits + deductedCredits,
            videosGenerated: Math.max(0, currentUser.videosGenerated - 1)
          });
          console.log(`Successfully refunded ${deductedCredits} credits to user ${userId}`);
        }
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }

    // 解析KIE.AI错误并提供用户友好的错误信息
    let userFriendlyMessage = 'サーバーエラーが発生しました。しばらく待ってからお試しください。';
    let shouldSendAdminAlert = false;
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      // 根据KIE.AI API文档的错误信息进行分类
      if (errorMessage.includes('400') || errorMessage.includes('Your prompt was flagged')) {
        userFriendlyMessage = 'プロンプトがコンテンツポリシーに違反しています。';
      } else if (errorMessage.includes('402')) {
        userFriendlyMessage = '現在利用者が多く、システムが混雑しています。しばらくお待ちいただき、後ほどお試しください。';
        shouldSendAdminAlert = true;
      } else if (errorMessage.includes('Only English prompts are supported')) {
        userFriendlyMessage = '現在英語プロンプトのみサポートされています。';
      } else if (errorMessage.includes('Failed to fetch the image')) {
        userFriendlyMessage = '画像の取得に失敗しました。';
      } else if (errorMessage.includes('public error unsafe image upload')) {
        userFriendlyMessage = '画像の内容が安全基準に適合しません。';
      } else if (errorMessage.includes('500') || errorMessage.includes('Internal Error')) {
        userFriendlyMessage = 'サーバー内部エラーが発生しました。しばらく待ってからお試しください。';
      } else if (errorMessage.includes('501') || errorMessage.includes('Failed - Video generation task failed')) {
        userFriendlyMessage = '動画生成タスクが失敗しました。しばらく待ってからお試しください。';
      } else if (errorMessage.includes('Timeout')) {
        userFriendlyMessage = '処理がタイムアウトしました。しばらく待ってからお試しください。';
      }
    }
    
    // 如果是402错误，发送管理员警报邮件
    if (shouldSendAdminAlert) {
      try {
        const { sendEmail } = await import('./email');
        await sendEmail({
          to: 'angelsphoto99@gmail.com',
          subject: '【緊急】KIE.AI Credit不足警告',
          html: `
            <h2>KIE.AI Credit不足警告</h2>
            <p>映像工房システムにて、KIE.AIのcreditが不足しています。</p>
            <p><strong>発生時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
            <p><strong>エラー詳細:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p><strong>対応が必要:</strong> KIE.AIのcreditを至急チャージしてください。</p>
            <p>ユーザーには「システム混雑」として案内し、300ポイントを返還済みです。</p>
          `
        });
        console.log('Admin alert email sent for KIE.AI credit shortage');
      } catch (emailError) {
        console.error('Failed to send admin alert email:', emailError);
      }
    }
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.GENERATION_FAILED,
        message: userFriendlyMessage
      }
    };
  }
}

// 查询视频状态
export async function getVideoStatus(taskId: string): Promise<IApiResponse<IVideo>> {
  try {
    // 查询KIE.AI状态
    const kieAiStatus = await kieAiClient.getVideoStatus(taskId);
    
    // 查找数据库中的视频记录
    const dbVideo = await dbAdmin.getVideoByTaskId(taskId);
    if (!dbVideo) {
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
    } else if (kieAiStatus.data && kieAiStatus.data.successFlag === 0) {
      newStatus = 'processing';
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
    if (newStatus === 'failed' && !dbVideo.error_message) {
      let userFriendlyMessage = 'コンテンツが安全基準に適合しません。別の内容をお試しください。';
      
      // 从KIE.AI响应中提取错误信息
      if (kieAiStatus.data && kieAiStatus.data.errorMessage) {
        const errorMessage = kieAiStatus.data.errorMessage;
        
        // 将技术错误信息转换为用户友好的提示
        if (errorMessage.includes('unsafe image upload') || errorMessage.includes('public error unsafe image upload')) {
          userFriendlyMessage = '画像の内容が安全基準に適合しません。';
        } else if (errorMessage.includes('402')) {
          userFriendlyMessage = '現在利用者が多く、システムが混雑しています。しばらくお待ちいただき、後ほどお試しください。';
        } else if (errorMessage.includes('Failed to fetch the image')) {
          userFriendlyMessage = '画像の取得に失敗しました。';
        } else if (errorMessage.includes('Only English prompts are supported')) {
          userFriendlyMessage = '現在英語プロンプトのみサポートされています。';
        } else if (errorMessage.includes('violating content policies')) {
          userFriendlyMessage = 'コンテンツポリシーに違反しています。';
        } else if (errorMessage.includes('image')) {
          userFriendlyMessage = '画像の処理中にエラーが発生しました。';
        } else if (errorMessage.includes('content') || errorMessage.includes('policy') || errorMessage.includes('unsafe')) {
          userFriendlyMessage = 'コンテンツが安全基準に適合しません。';
        } else if (errorMessage.includes('400') || errorMessage.includes('violating content policies')) {
          userFriendlyMessage = 'プロンプトがコンテンツポリシーに違反しています。別の内容でお試しください。';
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Error')) {
          userFriendlyMessage = 'サーバー内部エラーが発生しました。しばらく待ってからお試しください。';
        } else if (errorMessage.includes('501') || errorMessage.includes('Failed - Video generation task failed')) {
          userFriendlyMessage = '動画生成タスクが失敗しました。しばらく待ってからお試しください。';
        } else if (errorMessage.includes('Timeout')) {
          userFriendlyMessage = '処理がタイムアウトしました。しばらく待ってからお試しください。';
        }
      } else if (kieAiStatus.code && kieAiStatus.code !== 200) {
        // 处理HTTP错误状态码
        if (kieAiStatus.code === 400) {
          userFriendlyMessage = 'プロンプトがコンテンツポリシーに違反しています。別の内容でお試しください。';
        } else if (kieAiStatus.code === 402) {
          userFriendlyMessage = '現在利用者が多く、システムが混雑しています。しばらくお待ちいただき、後ほどお試しください。';
        } else if (kieAiStatus.code === 429) {
          userFriendlyMessage = 'リクエストが多すぎます。しばらく待ってからお試しください。';
        } else if (kieAiStatus.code === 500) {
          userFriendlyMessage = 'サーバー内部エラーが発生しました。しばらく待ってからお試しください。';
        } else if (kieAiStatus.code === 501) {
          userFriendlyMessage = '動画生成タスクが失敗しました。しばらく待ってからお試しください。';
        } else {
          userFriendlyMessage = 'サーバーエラーが発生しました。しばらく待ってからお試しください。';
        }
      }
      
      updates.error_message = userFriendlyMessage;
    }
    
    // 处理退款逻辑（当生成失败时）- 确保所有失败情况都能退款
    
    // 修改退款逻辑：只要视频失败且有消耗积分，就应该退款（除非已经退款过）
    const shouldRefund = newStatus === 'failed' && 
                        dbVideo.creditsUsed > 0 && 
                        (dbVideo.status === 'pending' || dbVideo.status === 'processing' || 
                         (dbVideo.status === 'failed' && (!dbVideo.error_message || dbVideo.error_message.includes('安全基準'))));
    
    if (shouldRefund) {
      try {
        // 获取用户当前信息
        const user = await dbAdmin.findById(dbVideo.userId);
        if (user && dbVideo.creditsUsed > 0) {
          // 退还credits并减少生成次数
          const refundCredits = dbVideo.creditsUsed;
          await dbAdmin.update(dbVideo.userId, {
            credits: user.credits + refundCredits,
            videosGenerated: Math.max(0, user.videosGenerated - 1)
          });
          
          console.log(`Refunded ${refundCredits} credits to user ${dbVideo.userId} for failed generation`);
          
          // 记录退款原因
          const errorSource = kieAiStatus.data?.errorMessage || `HTTP ${kieAiStatus.code}` || 'Unknown error';
          
          // 如果是402错误，发送管理员警报邮件
          if (errorSource.includes('402') || kieAiStatus.code === 402) {
            try {
              const { sendEmail } = await import('./email');
              await sendEmail({
                to: 'angelsphoto99@gmail.com',
                subject: '【緊急】KIE.AI Credit不足警告',
                html: `
                  <h2>KIE.AI Credit不足警告</h2>
                  <p>映像工房システムにて、KIE.AIのcreditが不足しています。</p>
                  <p><strong>発生時刻:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                  <p><strong>TaskID:</strong> ${dbVideo.taskId}</p>
                  <p><strong>エラー詳細:</strong> ${errorSource}</p>
                  <p><strong>対応が必要:</strong> KIE.AIのcreditを至急チャージしてください。</p>
                  <p>ユーザーには「システム混雑」として案内し、${refundCredits}ポイントを返還済みです。</p>
                `
              });
              console.log('Admin alert email sent for KIE.AI credit shortage');
            } catch (emailError) {
              console.error('Failed to send admin alert email:', emailError);
            }
          }
        }
      } catch (refundError) {
        console.error('Failed to process refund:', refundError);
        // 继续执行，不要因为退款失败而中断状态更新
      }
    }
    
    // 如果有更新，保存到数据库
    let updatedVideo = dbVideo;
    if (Object.keys(updates).length > 0) {
      const updateResult = await dbAdmin.updateVideo(dbVideo.id, updates);
      if (!updateResult) {
        throw new Error('Failed to update video in database');
      }
      updatedVideo = updateResult;
    }

    // 使用转换函数构建返回的视频对象
    const video: IVideo = dbVideoToVideo(updatedVideo);

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
    // 显示指定状态的视频，如果未指定则显示所有状态
    if (options.status) {
      dbOptions.status = options.status;
    }
    // 修复：为新用户提供友好的空结果，避免错误提示
    let result;
    try {
      // 尝试调用数据库方法（如果不存在会报错）
      if (typeof dbAdmin.getUserVideos === 'function') {
        result = await dbAdmin.getUserVideos(userId, dbOptions);
      } else {
        // 数据库方法不存在，直接返回空数组（新用户情况）
        result = [];
      }
    } catch (error) {
      // 对于新用户或方法不存在，返回空数组而不是错误
      result = [];
    }
    const videos = Array.isArray(result) ? result : [];
    
    const processedVideos: IVideo[] = videos
      .map((video: any) => {
        // 使用转换函数将数据库格式转换为前端格式
        return dbVideoToVideo(video);
      });

    return {
      success: true,
      data: {
        videos: processedVideos,
        total: processedVideos.length // 当前页的视频数量，前端会根据返回数量判断是否还有更多
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
    const video = await dbAdmin.getVideoByTaskId(videoId);
    
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
    const video = await dbAdmin.getVideoByTaskId(videoId);
    
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
export async function batchUpdatePendingVideos(): Promise<{
  success: boolean;
  updatedCount: number;
  completedVideos: number;
  failedVideos: number;
  errors: string[];
}> {
  const result = {
    success: true,
    updatedCount: 0,
    completedVideos: 0,
    failedVideos: 0,
    errors: [] as string[]
  };

  try {
    // 获取前5个pending/processing状态的视频
    const pendingVideos = await dbAdmin.getPendingVideos(5);
    
    if (pendingVideos.length === 0) {
      return result;
    }

    console.log(`Found ${pendingVideos.length} pending/processing videos to check`);

    // 批量检查每个视频的状态
    for (const video of pendingVideos) {
      try {
        const statusResult = await getVideoStatus(video.task_id);
        
        if (statusResult.success) {
          result.updatedCount++;
          
          // 统计完成和失败的视频
          if (statusResult.data?.status === 'completed') {
            result.completedVideos++;
          } else if (statusResult.data?.status === 'failed') {
            result.failedVideos++;
          }
        } else {
          result.errors.push(`Failed to check ${video.task_id}: ${statusResult.error?.message}`);
        }
      } catch (error) {
        const errorMsg = `Error checking ${video.task_id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log(`Batch update completed: ${result.updatedCount} updated, ${result.completedVideos} completed, ${result.failedVideos} failed`);
    return result;

  } catch (error) {
    console.error('Batch update error:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
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
    let processedCount = 0;
    let refundedCredits = 0;
    const errors: string[] = [];

    // 获取用户的视频并过滤失败的视频
    if (!userId) {
      throw new Error('User ID is required for refund processing');
    }
    
    const videosResult = await getUserVideos(userId, { limit: 100 });
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
          const user = await dbAdmin.findById(video.userId);
          if (user && video.creditsUsed > 0) {
            // 退还credits并减少生成次数
            await dbAdmin.update(video.userId, {
              credits: user.credits + video.creditsUsed,
              videosGenerated: Math.max(0, user.videosGenerated - 1)
            });
            
            processedCount++;
            refundedCredits += video.creditsUsed;
            
            console.log(`Refunded ${video.creditsUsed} credits to user ${video.userId} for failed video`);
          }
        } catch (error) {
          const errorMsg = `Failed to process refund for video ${video.taskId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
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