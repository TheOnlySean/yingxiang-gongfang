'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Layout, Card, Button, Form, Input, Upload, message, Spin, Progress, 
  Typography, Image, Modal
} from 'antd';
import { 
  VideoCameraOutlined, PictureOutlined, UserOutlined, LockOutlined,
  LogoutOutlined, InboxOutlined, EyeOutlined, DeleteOutlined, 
  FullscreenOutlined, DownloadOutlined,
  HistoryOutlined, ReloadOutlined, ThunderboltOutlined, CreditCardOutlined
} from '@ant-design/icons';
import { IUser, IVideo, IUploadedImage } from '@/types';
import TemplateSelector, { TemplateId } from './TemplateSelector';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 添加常量配置
const VIDEOS_PER_PAGE = 3; // 每页显示3个视频
const SCROLL_THRESHOLD = 100; // 滚动到底部100px时加载更多

// 全局API调用追踪器，防止重复调用
let isVideosApiCallInProgress = false;
let lastVideosApiCallTime = 0;
const VIDEOS_API_THROTTLE = 1000; // 1秒内只允许一次API调用

export default function WorkingPlayground() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 认证和用户状态
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_loginForm] = Form.useForm();

  // 模板选择状态
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>('general');

  // 视频生成相关状态
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(''); // seed状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'preparing' | 'waiting' | 'polling' | 'completed'>('preparing');
  
  // 轮询控制状态 - 只保留实际使用的
  const [, setCurrentTaskId] = useState<string | null>(null);
  
  // API调用防重复控制
  const [isVideoHistoryLoading, setIsVideoHistoryLoading] = useState(false);

  // 视频历史相关状态（分页）
  const [videoHistory, setVideoHistory] = useState<IVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<IUploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 登录弹窗状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // 积分不足弹窗状态
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);

  // 视频播放相关状态
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<IVideo | null>(null);
  // 视频缩略图缓存
  const [videoThumbnails, setVideoThumbnails] = useState<{ [key: string]: string }>({});
  
  // refs
  const contentRef = useRef<HTMLDivElement>(null);

  // 生成视频缩略图
  const generateVideoThumbnail = useCallback((videoUrl: string, videoId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 如果已经有缓存的缩略图，直接返回
      if (videoThumbnails[videoId]) {
        console.log(`💾 Using cached thumbnail for video ${videoId}`);
        resolve(videoThumbnails[videoId]);
        return;
      }

      console.log(`🎬 Generating thumbnail for video ${videoId}...`);
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      video.crossOrigin = 'anonymous';
      video.muted = true; // 静音以避免自动播放策略问题
      
      // 设置超时处理
      const timeoutId = setTimeout(() => {
        console.error(`⏰ Thumbnail generation timeout for video ${videoId}`);
        reject(new Error('Thumbnail generation timeout'));
      }, 10000); // 10秒超时
      
      video.onloadedmetadata = () => {
        console.log(`📊 Video metadata loaded for ${videoId}: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration}s`);
        // 设置到第1秒或视频长度的10%，取较小值
        const targetTime = Math.min(1, video.duration * 0.1);
        console.log(`⏱️ Setting video time to ${targetTime}s for thumbnail`);
        video.currentTime = targetTime;
      };
      
      video.onseeked = () => {
        try {
          clearTimeout(timeoutId);
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          console.log(`✅ Thumbnail generated successfully for video ${videoId}, size: ${thumbnailDataUrl.length} bytes`);
          
          // 缓存缩略图
          setVideoThumbnails(prev => ({
            ...prev,
            [videoId]: thumbnailDataUrl
          }));
          
          resolve(thumbnailDataUrl);
        } catch (error) {
          clearTimeout(timeoutId);
          console.error(`❌ Error generating thumbnail for video ${videoId}:`, error);
          reject(error);
        }
      };
      
      video.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error(`🚫 Video load error for ${videoId}:`, error);
        reject(new Error('Failed to load video'));
      };
      
      console.log(`🔗 Loading video source: ${videoUrl}`);
      video.src = videoUrl;
    });
  }, [videoThumbnails]);

  // 播放指定视频
  const handlePlayVideo = useCallback((video: IVideo) => {
    setCurrentPlayingVideo(video);
    setVideoPlayerVisible(true);
  }, []);

  // 关闭视频播放器
  const handleCloseVideoPlayer = useCallback(() => {
    setVideoPlayerVisible(false);
    setCurrentPlayingVideo(null);
  }, []);

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    try {
      // 检查是否在客户端环境
      if (typeof window === 'undefined') {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出处理
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setVideoHistory([]);
    setUploadedImages([]);
    setPrompt('');
    setSeed(''); // 清除seed
    message.success('ログアウトしました');
  }, []);

  // 分页加载视频历史
  const loadVideoHistory = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (!user) return;

    // 全局API调用防重复检查
    const now = Date.now();
    if (isVideosApiCallInProgress) {
      console.log('Videos API call already in progress, skipping...');
      return;
    }
    if (now - lastVideosApiCallTime < VIDEOS_API_THROTTLE) {
      console.log('Videos API call throttled, skipping...');
      return;
    }

    // 防止重复加载
    if (page === 1 && (isLoadingHistory || isVideoHistoryLoading)) return;
    if (page > 1 && isLoadingMore) return;

    console.log(`Videos API called with: { limit: ${VIDEOS_PER_PAGE}, offset: ${(page - 1) * VIDEOS_PER_PAGE} }`);

    isVideosApiCallInProgress = true;
    lastVideosApiCallTime = now;

    if (page === 1) {
      setIsLoadingHistory(true);
      setIsVideoHistoryLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const token = localStorage.getItem('token');
      const offset = (page - 1) * VIDEOS_PER_PAGE;
      
      const response = await fetch(`/api/videos?limit=${VIDEOS_PER_PAGE}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // API响应格式: { success: true, data: { videos: [...], total: number } }
        const newVideos = result.data?.videos || [];
        
        if (reset || page === 1) {
          setVideoHistory(newVideos);
        } else {
          setVideoHistory(prev => [...prev, ...newVideos]);
        }
        

        
        // 检查是否还有更多视频
        setHasMoreVideos(newVideos.length === VIDEOS_PER_PAGE);
        setCurrentPage(page);
      } else {
        message.error('動画履歴の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Load video history error:', error);
      message.error('動画履歴の読み込みエラー');
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
      if (page === 1) {
        setIsVideoHistoryLoading(false);
      }
      isVideosApiCallInProgress = false;
    }
  }, [user, isLoadingHistory, isLoadingMore, isVideoHistoryLoading]);

  // 滚动监听，加载更多视频
  const handleScroll = useCallback(() => {
    if (!contentRef.current || isLoadingMore || !hasMoreVideos) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight - scrollTop <= clientHeight + SCROLL_THRESHOLD) {
      const nextPage = currentPage + 1;
      loadVideoHistory(nextPage, false);
    }
  }, [isLoadingMore, hasMoreVideos, currentPage, loadVideoHistory]);

  // 刷新视频历史的内部函数
  const refreshHistoryInternal = useCallback(async (isManualRefresh: boolean = true) => {
    if (isUpdating) return; // 防止重复点击
    
    setIsUpdating(true);
    
    try {
      // 先执行批量更新pending/processing视频状态
      const token = localStorage.getItem('token');
      console.log('🔄 Checking pending/processing videos...');
      
      const batchResponse = await fetch('/api/batch-update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        const data = batchResult.data;
        
        if (data.updatedCount > 0) {
          console.log(`✅ Batch update completed: ${data.updatedCount} videos checked`);
          
          // 显示用户友好的提醒
          if (data.completedVideos > 0) {
            message.success(`${data.completedVideos}本の動画生成が完了しました！`);
          }
          if (data.failedVideos > 0) {
            message.warning(`${data.failedVideos}本の動画生成に失敗しました（400/500/501エラー含む）。使用したポイントは自動的に返還されました。`);
          }
          if (data.completedVideos === 0 && data.failedVideos === 0) {
            message.info(`${data.updatedCount}本の動画状況を確認しました。`);
          }
        } else {
          console.log('ℹ️ No pending videos to update');
          // 只在用户手动点击更新时显示"没有确认中视频"的提醒
          if (isManualRefresh) {
            message.info('確認中の動画はありません');
          }
        }
      } else {
        console.error('Failed to perform batch update:', batchResponse.statusText);
      }
    } catch (error) {
      console.error('Batch update error:', error);
      // 批量更新失败不影响刷新历史
    }

    // 然后刷新视频历史
    setCurrentPage(1);
    setHasMoreVideos(true);
    loadVideoHistory(1, true);
    
    setIsUpdating(false);
  }, [loadVideoHistory, isUpdating]);

  // 用户点击更新按钮的处理函数
  const handleRefreshHistory = useCallback(() => {
    refreshHistoryInternal(true); // 手动刷新
  }, [refreshHistoryInternal]);

  // 自动刷新（视频完成后）的函数
  const autoRefreshHistory = useCallback(() => {
    refreshHistoryInternal(false); // 自动刷新，不显示"没有确认中视频"
  }, [refreshHistoryInternal]);

  // 定期检查pending/processing视频的定时器
  useEffect(() => {
    if (!user) return;

    let intervalId: NodeJS.Timeout;
    
    // 检查是否有pending/processing状态的视频需要更新
    const checkPendingVideos = async () => {
      try {
        // 如果正在生成中，不执行检查（避免干扰）
        if (isGenerating) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;

        // 只有当视频历史中有pending/processing状态的视频时才执行批量更新
        const hasPendingVideos = videoHistory.some(video => 
          video.status === 'pending' || video.status === 'processing'
        );

        if (hasPendingVideos) {
          console.log('🔄 Auto-checking pending/processing videos...');
          
          const batchResponse = await fetch('/api/batch-update', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (batchResponse.ok) {
            const batchResult = await batchResponse.json();
            const data = batchResult.data;
            
            if (data.updatedCount > 0) {
              console.log(`✅ Auto-check completed: ${data.updatedCount} videos updated, ${data.failedVideos} failed (refunded)`);
              // 静默刷新视频历史
              loadVideoHistory(1, true);
            }
          }
        }
      } catch (error) {
        console.error('Auto-check pending videos failed:', error);
        // 不显示错误消息，静默失败
      }
    };

    // 启动定时器：每30秒检查一次
    intervalId = setInterval(checkPendingVideos, 30000);

    // 立即执行一次检查
    checkPendingVideos();

    // 清理定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, videoHistory, isGenerating, loadVideoHistory]);

  // 下载视频文件到本地
  const downloadVideo = useCallback(async (videoUrl: string, filename?: string) => {
    try {
      message.loading('ダウンロード準備中...', 0.5);
      
      // 获取视频文件
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました');
      }
      
      // 创建 blob
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名
      const defaultFilename = `video_${new Date().getTime()}.mp4`;
      link.download = filename || defaultFilename;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('ダウンロードが開始されました');
    } catch (error) {
      console.error('Download error:', error);
      message.error('ダウンロードに失敗しました');
    }
  }, []);



  // 处理图片上传 - 只允许一张图片
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
          method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      console.log('Upload result:', result);

      if (result.success && result.data?.uploads?.[0]?.success) {
        const imageUrl = result.data.uploads[0].imageUrl;
        console.log('🖼️ Image upload successful:', {
          fileName: file.name,
          imageUrl: imageUrl,
          urlType: imageUrl.startsWith('https://') && imageUrl.includes('vercel-storage.com') ? 'Vercel Blob' : 
                   imageUrl.startsWith('/uploads/') ? 'Local Storage' : 'Other'
        });
        
        // 检查图片内容类型的友好提示
        if (file.type.startsWith('image/')) {
          console.log('💡 画像アップロード成功！動画生成がうまくいかない場合は、風景や動物などの画像をお試しください。');
        }
        
        const newImage: IUploadedImage = {
          uid: Date.now().toString(),
          name: file.name,
          url: imageUrl
        };
        // 替换现有图片（只保留一张）
        setUploadedImages([newImage]);
        message.success('画像のアップロードが完了しました');
          } else {
        const error = result.data?.uploads?.[0]?.error || result.error?.message || 'アップロード失敗';
        console.error('Upload failed:', error);
        message.error(`画像のアップロードに失敗しました: ${error}`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      message.error('画像のアップロードエラー');
    } finally {
      setIsUploading(false);
    }
  };

  // 移除图片
  const handleRemoveImage = (uid: string) => {
    setUploadedImages(prev => prev.filter(img => img.uid !== uid));
  };

  // 预览图片
  const handlePreviewImage = (url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  };

  // 生成视频
  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      message.error('動画の説明を入力してください');
      return;
    }

    // 检查用户是否已登录
    if (!isAuthenticated || !user) {
      setShowLoginModal(true);
      message.info('動画を生成するにはログインが必要です');
      return;
    }

    if (user.credits <= 0) {
      setShowInsufficientCreditsModal(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStage('preparing');
    
    try {
      const token = localStorage.getItem('token');
      const requestData = {
        originalPrompt: prompt.trim(),
        imageUrls: uploadedImages.map(img => img.url),
        ...(seed.trim() && { seed: seed.trim() }), // 只有在seed有值时才添加
        ...(selectedTemplate && { templateId: selectedTemplate }) // 添加模板ID
      };
      
      console.log('🎬 Sending video generation request:', {
        hasImages: uploadedImages.length > 0,
        imageCount: uploadedImages.length,
        imageUrls: uploadedImages.map(img => img.url),
        promptLength: prompt.trim().length
      });

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generate API response:', data); // 添加调试日志
        
        // 修正：taskId在data.data中
        const taskId = data.data?.taskId;
        
        if (!taskId) {
          console.error('No taskId in response:', data);
          message.error('動画生成に失敗しました：タスクIDを取得できませんでした');
          setIsGenerating(false);
          return;
        }

        // 关键修复：立即刷新历史记录，让新创建的pending视频进入监控列表
        console.log('🚀 新しいビデオが開始されました。保留中のステータスを追跡するために履歴を更新しています...');
        loadVideoHistory(1, true);

        console.log('Starting polling for taskId:', taskId);
        setCurrentTaskId(taskId);

        // 开始轮询
        setGenerationStage('waiting');
        setGenerationProgress(5);

        // 优化：更快开始轮询 - 30秒而不是2分钟
        const waitTime = 30000; // 30秒

        console.log(`Production mode: waiting ${waitTime/1000}s before polling`);

        // 立即开始平滑的进度动画（0到95%）
        const totalPollingTime = 240000; // 总轮询时间4分钟
        const progressUpdateInterval = 2000; // 每2秒更新一次进度
        const progressIncrement = 90 / (totalPollingTime / progressUpdateInterval); // 90% / 更新次数

        const progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            const newProgress = prev + progressIncrement;
            if (newProgress >= 95) {
              clearInterval(progressInterval);
              return 95; // 最多到95%，完成时跳到100%
            }
            return newProgress;
          });
        }, progressUpdateInterval);

        // 等待后开始轮询
        setTimeout(() => {
          setGenerationStage('polling');
          startPolling(taskId);
        }, waitTime);

      } else {
        const errorData = await response.json();
        console.error('Generate API error:', errorData);
        // 确保只传递字符串给message.error
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : errorData.error?.message || '動画生成に失敗しました';
        message.error(errorMessage);
        
        // 显示积分退还信息（生成请求立即失败时）
        setTimeout(() => {
          message.info('使用したポイント（300ポイント）は自動的に返還されました。');
        }, 1500);
        
        // 刷新用户信息以显示退还的积分
        const token = localStorage.getItem('token');
        if (token) {
          const userResponse = await fetch('/api/auth/verify', { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
          }
        }
        
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Generate video error:', error);
      message.error('動画生成エラーが発生しました');
      setIsGenerating(false);
    }
  };

  // 轮询视频状态
  const startPolling = async (taskId: string) => {
    const maxAttempts = 80; // 20分钟，每15秒一次
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGenerating(false);
        setGenerationStage('completed');
        message.error('動画生成がタイムアウトしました。履歴からご確認ください。');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/status/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Status API response:', data); // 添加调试日志
          
          // 修正：状态在data.data中，不是data中
          const videoData = data.data;
          
          if (videoData?.status === 'completed') {
            setGenerationProgress(100);
            setGenerationStage('completed');
                setIsGenerating(false);
            
            // 刷新视频历史（自动刷新，不显示多余提醒）
              setTimeout(() => {
              autoRefreshHistory();
              }, 1000);
            
            // 清除提示词和图片
            setPrompt('');
            setSeed(''); // 清除seed
            setUploadedImages([]);
            
            message.success('動画生成が完了しました！履歴からご確認ください。');
            
            // 更新用户信息
            const userResponse = await fetch('/api/auth/verify', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
            
            return;
          } else if (videoData?.status === 'failed') {
            setIsGenerating(false);
            setGenerationStage('completed');
            // 确保只传递字符串给message.error
            const errorMessage = typeof videoData.error === 'string' 
              ? videoData.error 
              : videoData.error?.message || '動画生成に失敗しました';
            message.error(errorMessage);
            
            // 显示积分退还信息
            setTimeout(() => {
              message.info('使用したポイント（300ポイント）は自動的に返還されました。');
            }, 1500);
            
            // 刷新用户信息以显示退还的积分
            const userResponse = await fetch('/api/auth/verify', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
            
            return;
          }
          
          // 显示当前状态和进度
          console.log('Current status:', videoData?.status, 'Progress:', videoData?.progress);
          
          // 进度条现在由定时器自动更新，不需要在这里手动更新
          
        } else {
          console.error('Status check failed:', response.statusText);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }

      attempts++;
      setTimeout(poll, 15000); // 15秒后再次轮询
    };

    poll();
  };

  // 初始化
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 当用户认证后加载视频历史
  useEffect(() => {
    if (isAuthenticated && user && !isVideoHistoryLoading) {
      console.log('Loading video history due to auth change');
      loadVideoHistory(1, true);
    }
  }, [isAuthenticated, user]);

  // 添加滚动监听
  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [handleScroll]);

  // 添加窗口焦点监听，用于当用户从其他页面（如支付页面）返回时刷新用户信息
  useEffect(() => {
    let lastFocusTime = 0;
    const FOCUS_THROTTLE = 5000; // 5秒内只允许一次焦点刷新
    
    const handleWindowFocus = () => {
      const now = Date.now();
      // 只有在用户已认证且距离上次焦点刷新超过5秒时才刷新
      if (isAuthenticated && user && (now - lastFocusTime > FOCUS_THROTTLE)) {
        console.log('Window focused, refreshing user data...');
        lastFocusTime = now;
        checkAuth();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAuthenticated, user, checkAuth]);

  // 检测URL参数，自动刷新积分（购买完成后）
  useEffect(() => {
    const refreshCredits = searchParams.get('refresh_credits');
    if (refreshCredits === 'true' && isAuthenticated && user) {
      console.log('Purchase completed, refreshing credits...');
      checkAuth();
      // 清除URL参数，避免重复刷新
      router.replace('/');
    }
  }, [searchParams, isAuthenticated, user, checkAuth, router]);

  // 加载中状态
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh' 
        }}>
          <Spin size="large" />
        </div>
      </Layout>
    );
  }

  // 认证状态检查 - 但允许未登录用户访问界面

  // 已认证状态 - 使用Sider + Content布局
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '18px',
            color: '#ffffff',
            letterSpacing: '0.05em'
          }}>
            映像工房
          </div>
                      <Text style={{ 
              color: '#ffffff', 
              fontSize: '14px',
              fontWeight: '500',
              opacity: 0.9
            }}>
              想像を映像に変える魔法
            </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated && user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text style={{ color: '#ffffff' }}>
                  {user.email} ({user.credits} ポイント)
                </Text>
                <Button 
                  icon={<CreditCardOutlined />}
                  onClick={() => router.push('/credits/purchase')}
                  style={{ 
                    background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 'bold'
                  }}
                  size="small"
                >
                  ポイント購入
                </Button>
              </div>
              <Button 
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff'
                }}
              >
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Text style={{ color: '#a0a0a0' }}>
                ログインしてご利用ください
              </Text>
              <Button 
                icon={<UserOutlined />}
                onClick={() => setShowLoginModal(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 'bold'
                }}
              >
                ログイン
              </Button>
              <Button 
                onClick={() => window.open('/auth/register', '_blank')}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff'
                }}
              >
                新規登録
              </Button>
            </>
          )}
        </div>
      </Header>
      
      <Layout style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        {/* 左侧设置面板 */}
        <Sider 
          width={450} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '24px',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'auto',
            height: 'calc(100vh - 64px)' // 64px是Header的高度
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
              設定
            </Title>
          </div>

          {/* 模板选择器 */}
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
          />

          {/* 提示词输入 */}
          <Card 
            title={
              <span style={{ color: '#ffffff' }}>
                <VideoCameraOutlined style={{ marginRight: '8px' }} />
                動画生成プロンプト（説明文）
              </span>
            }
            style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.1), rgba(255, 107, 122, 0.1))',
              border: '1px solid rgba(230, 0, 51, 0.3)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(230, 0, 51, 0.2)'
            }}
          >
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="生成したい動画の内容を日本語で詳しく説明してください..."
              rows={6}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '8px',
                marginBottom: '16px',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
                        />
            
            {/* Seed设置 */}
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ color: '#ffffff', display: 'block', marginBottom: '8px' }}>
                シード値（オプション）
              </Text>
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="一貫性のある結果を得るためのSeed値を入力（空白の場合はランダム）"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                height: '40px'
              }}
            />
              <Text style={{ color: '#a0a0a0', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                同じSeed値を使用することで、類似の結果を再現できます
              </Text>
            </div>

              <Button
                type="primary"
                size="large"
                loading={isGenerating}
                onClick={handleGenerateVideo}
                disabled={!prompt.trim() || (isAuthenticated && user !== null && user.credits <= 0)}
                style={{
                  width: '100%',
                  height: '48px',
                  background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                {isGenerating ? '生成中...' : !isAuthenticated ? 'ログインして動画を生成' : '動画を生成（300ポイント）'}
              </Button>
              
              {/* 音频功能提示 */}
              <div style={{ 
                marginTop: '12px', 
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '4px'
              }}>
                <span style={{ 
                  color: '#faad14',
                  fontSize: '12px'
                }}>
                  🔊
                </span>
                <Text style={{ 
                  color: 'rgba(255, 255, 255, 0.5)', 
                  fontSize: '9px',
                  lineHeight: '1.3',
                  fontWeight: '300'
                }}>
                  音声は実験的な機能のため、一部の動画ではご利用いただけない場合がございます。
                </Text>
              </div>
              
            {user && (user.credits ?? 0) <= 0 && (
                <Text style={{ color: '#ff4d4f', textAlign: 'center', display: 'block', marginTop: '8px' }}>
                  ポイントが不足しています
                </Text>
              )}
          </Card>

          {/* 图片上传区域 */}
          <Card 
            title={
              <span style={{ color: '#ffffff' }}>
                <PictureOutlined style={{ marginRight: '8px' }} />
                画像アップロード（オプション）
                {isUploading && <Spin size="small" style={{ marginLeft: '8px' }} />}
              </span>
            }
            style={{ 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.1), rgba(255, 107, 122, 0.1))',
              border: '1px solid rgba(230, 0, 51, 0.3)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(230, 0, 51, 0.2)'
            }}
          >
            <Dragger
              multiple={false}
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false;
              }}
              disabled={isUploading}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                minHeight: uploadedImages.length > 0 ? '200px' : '120px',
                padding: uploadedImages.length > 0 ? '0' : '20px'
              }}
            >
              {uploadedImages.length === 0 ? (
                // 显示上传提示
                <>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#ffffff' }} />
              </p>
              <p style={{ color: '#ffffff' }}>
                    ドラッグ&ドロップまたはクリックして画像をアップロード
              </p>
              <p style={{ color: '#a0a0a0' }}>
                    対応形式：JPG、JPEG、PNG、GIF、WebP；各ファイル最大10MB
                  </p>
                </>
              ) : (
                // 显示已上传的图片 - 填满整个框
                <div style={{ 
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: '4px'
                }}>
                  {/* 主要显示的图片 */}
                        <Image
                    src={uploadedImages[0]?.url || ''}
                    alt={uploadedImages[0]?.name || ''}
                          style={{ 
                            width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                          }}
                          preview={false}
                        />
                  
                  {/* 覆盖信息层 */}
                        <div style={{
                          position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)',
                          display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '12px'
                  }}>
                    {/* 顶部信息 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ 
                        color: '#ffffff', 
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        クリックして画像を変更
                      </Text>
                      <div style={{ display: 'flex', gap: '4px' }}>
                          <Button
                            size="small"
                            type="text"
                            icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (uploadedImages[0]?.url) {
                              handlePreviewImage(uploadedImages[0].url);
                            }
                          }}
                            style={{
                              background: 'rgba(0, 0, 0, 0.6)',
                              color: '#ffffff',
                              border: 'none',
                            padding: '4px 6px'
                            }}
                          />
                          <Button
                            size="small"
                            type="text"
                            icon={<DeleteOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (uploadedImages[0]?.uid) {
                              handleRemoveImage(uploadedImages[0].uid);
                            }
                          }}
                            style={{
                              background: 'rgba(255, 0, 0, 0.6)',
                              color: '#ffffff',
                              border: 'none',
                            padding: '4px 6px'
                            }}
                          />
                        </div>
                      </div>

                    {/* 底部提示 */}
                    <div style={{ textAlign: 'center' }}>
                      <Text style={{ 
                        color: '#ffffff', 
                        fontSize: '12px',
                        opacity: 0.8,
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                      }}>
                        {uploadedImages[0]?.name}
                      </Text>
                    </div>
                  </div>
              </div>
            )}
            </Dragger>
            
            {/* 图片比例建议 */}
            <Text style={{ 
              color: '#a0a0a0', 
              fontSize: '12px', 
              display: 'block', 
              marginTop: '8px',
              textAlign: 'center'
            }}>
              推奨比率：4:3または16:9
            </Text>
          </Card>
        </Sider>

        {/* 右侧预览区域 */}
        <Content style={{ padding: '24px' }}>
          <div 
            ref={contentRef}
            style={{ 
            height: 'calc(100vh - 112px)',
            overflowY: 'auto',
            paddingRight: '8px'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
                <HistoryOutlined style={{ marginRight: '8px' }} />
                動画履歴
              </Title>
              <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                loading={isLoadingHistory || isUpdating}
                onClick={handleRefreshHistory}
                  icon={<ReloadOutlined />}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff'
                }}
              >
                {isUpdating ? '確認中...' : '更新'}
              </Button>
              </div>
            </div>

            {/* 改进的生成进度显示 */}
            {isGenerating && (
              <Card style={{
                marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.1), rgba(255, 107, 122, 0.1))',
                border: '2px solid #e60033',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(230, 0, 51, 0.3)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
                    {generationStage === 'preparing' && '🎬 リクエスト準備中...'}
                    {generationStage === 'waiting' && '🤖 AI処理中...'}
                    {generationStage === 'polling' && '📊 状況確認中...'}
                    {generationStage === 'completed' && '✅ 動画生成完了！'}
                  </Title>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
                      {generationStage === 'preparing' && 'リクエストを送信しています'}
                      {generationStage === 'waiting' && '高品質な動画を生成中です'}
                      {generationStage === 'polling' && '進捗状況を確認中です'}
                      {generationStage === 'completed' && '動画が正常に生成されました'}
                    </Text>
                  </div>
                  
                  {/* 改进的圆形进度条 */}
                  <div style={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    marginBottom: '20px'
                  }}>
                  <Progress
                    type="circle"
                      percent={Math.round(generationProgress)}
                      size={140}
                    strokeColor={{
                      '0%': '#e60033',
                        '50%': '#ff6b7a',
                        '100%': '#ffaa00',
                    }}
                      strokeWidth={8}
                      trailColor="rgba(255, 255, 255, 0.1)"
                    format={(percent) => (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ 
                            color: '#ffffff', 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            lineHeight: '1'
                          }}>
                        {percent}%
                          </div>
                          <div style={{ 
                            color: '#a0a0a0', 
                            fontSize: '12px',
                            marginTop: '4px'
                          }}>
                            {generationStage === 'preparing' && '準備中'}
                            {generationStage === 'waiting' && 'AI処理中'}
                            {generationStage === 'polling' && '確認中'}
                            {generationStage === 'completed' && '完了'}
                          </div>
                        </div>
                      )}
                    />
                    
                    {/* 脉冲动画效果 */}
                    {generationStage !== 'completed' && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '160px',
                        height: '160px',
                        borderRadius: '50%',
                        border: '2px solid rgba(230, 0, 51, 0.3)',
                        opacity: 0.6
                      }} />
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
                      プロンプト: {prompt}
                    </Text>
                    {seed && (
                      <Text style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Seed: {seed}
                      </Text>
                    )}
                  </div>
                  
                  {generationStage === 'waiting' && (
                    <div style={{ marginTop: '12px' }}>
                      <Text style={{ color: '#ffaa00', fontSize: '13px' }}>
                        ⏳ 高品質な動画生成には時間がかかります。しばらくお待ちください...
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 32px',
                  background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.2), rgba(255, 107, 122, 0.2))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UserOutlined style={{ fontSize: '48px', color: '#e60033' }} />
                </div>
                
                <Title level={2} style={{ 
                  marginBottom: '16px', 
                  color: '#ffffff',
                  fontWeight: '300'
                }}>
                  ログインして開始
                </Title>
                
                                 <Text style={{ 
                   color: '#a0a0a0',
                   fontSize: '16px',
                   lineHeight: '1.6',
                   marginBottom: '24px',
                   display: 'block'
                 }}>
                   ログインすると、<br />
                   動画の生成履歴を確認できます。
                 </Text>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Button
                    type="primary"
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      padding: '0 24px'
                    }}
                  >
                    ログイン
                  </Button>
                  <Button
                    onClick={() => window.open('/auth/register', '_blank')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '0 24px'
                    }}
                  >
                    新規登録
                  </Button>
                </div>
              </div>
            ) : isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Spin size="large" />
                <Text style={{ color: '#a0a0a0', display: 'block', marginTop: '16px' }}>
                  履歴を読み込み中...
                </Text>
              </div>
            ) : videoHistory.length > 0 ? (
              <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {videoHistory.map((video, index) => (
                    <VideoHistoryCard 
                      key={video.id} 
                      video={video} 
                      index={index}
                      onPlay={handlePlayVideo}
                      generateThumbnail={generateVideoThumbnail}
                      downloadVideo={downloadVideo}
                      cachedThumbnail={videoThumbnails[video.id]}
                    />
                  ))}
                      </div>
                
                {/* 加载更多指示器 */}
                {isLoadingMore && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                    <Text style={{ color: '#a0a0a0', marginLeft: '8px' }}>
                      さらに読み込み中...
                    </Text>
                      </div>
                )}
                
                {!hasMoreVideos && videoHistory.length > VIDEOS_PER_PAGE && (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text style={{ color: '#a0a0a0' }}>
                      すべての動画を読み込みました
                      </Text>
                    </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 32px',
                  background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.2), rgba(255, 107, 122, 0.2))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <VideoCameraOutlined style={{ fontSize: '48px', color: '#e60033' }} />
                </div>
                
                <Title level={2} style={{ 
                  marginBottom: '16px', 
                  color: '#ffffff',
                  fontWeight: '300'
                }}>
                  AI準備完了、ぜひ制作を始めてください
                </Title>
                
                <Text style={{ 
                  color: '#a0a0a0',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '40px',
                  display: 'block'
                }}>
                  想像力を発揮して動画を創作してください
                </Text>

                {/* 功能特性展示 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '40px', 
                  marginTop: '20px' 
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 12px',
                      background: 'rgba(230, 0, 51, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PictureOutlined style={{ fontSize: '24px', color: '#e60033' }} />
                    </div>
                    <Text style={{ color: '#ffffff', fontSize: '12px', display: 'block' }}>
                      高品質画像対応
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 12px',
                      background: 'rgba(230, 0, 51, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <VideoCameraOutlined style={{ fontSize: '24px', color: '#e60033' }} />
                    </div>
                    <Text style={{ color: '#ffffff', fontSize: '12px', display: 'block' }}>
                      日本語対応
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 12px',
                      background: 'rgba(230, 0, 51, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ThunderboltOutlined style={{ fontSize: '24px', color: '#e60033' }} />
                    </div>
                    <Text style={{ color: '#ffffff', fontSize: '12px', display: 'block' }}>
                      高速処理
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Content>
      </Layout>

      {/* 图片预览模态框 */}
      {previewVisible && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setPreviewVisible(false)}
        >
          <Image
            src={previewImage}
            alt="preview"
            style={{ maxWidth: '90%', maxHeight: '90%' }}
            preview={false}
          />
        </div>
      )}

      {/* 视频播放模态框 */}
      {videoPlayerVisible && currentPlayingVideo && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={handleCloseVideoPlayer}
        >
          <div 
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxHeight: '90vh',
              width: 'auto',
              minWidth: '300px',
              maxWidth: '85vw'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HTML5 原生视频播放器 */}
            <div style={{ 
              position: 'relative', 
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <video
                src={currentPlayingVideo.videoUrl}
                controls
                muted={false}
                style={{ 
                  width: 'auto',
                  maxWidth: '80vw',
                  maxHeight: '60vh',
                  height: 'auto',
                  borderRadius: '12px',
                  display: 'block'
                }}
              />
              
              {/* 下载按钮 */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1002
              }}>
                <Button
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (currentPlayingVideo.videoUrl) {
                      const filename = `${currentPlayingVideo.originalPrompt.substring(0, 20)}_${new Date().getTime()}.mp4`;
                      downloadVideo(currentPlayingVideo.videoUrl, filename);
                    }
                  }}
                  style={{ 
                    color: '#ffffff', 
                    fontSize: '20px', 
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '8px',
                    border: 'none'
                  }}
                />
              </div>
            </div>
            
            {/* 视频信息和关闭按钮 - 重新排版 */}
              <div style={{
                textAlign: 'center',
              marginTop: '12px',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              maxWidth: '80vw'
            }}>
              <Text style={{ 
                color: '#b8b8b8', 
                fontSize: '10px',
                display: 'block',
                marginBottom: '4px',
                wordBreak: 'break-word',
                lineHeight: '1.3',
                opacity: 0.7
              }}>
                {currentPlayingVideo.originalPrompt}
                  </Text>
              <Text style={{ 
                color: '#777', 
                fontSize: '9px', 
                display: 'block', 
                marginBottom: '12px',
                opacity: 0.6
              }}>
                {new Date(currentPlayingVideo.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </Text>
              <Button 
                type="primary"
                onClick={handleCloseVideoPlayer}
                size="small"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff',
                  borderRadius: '14px',
                  fontSize: '11px',
                  height: '26px',
                  paddingLeft: '14px',
                  paddingRight: '14px'
                }}
              >
                閉じる
              </Button>
                </div>
              </div>
        </div>
      )}

      {/* 积分不足弹窗 */}
      <Modal
        title={
                     <div style={{ textAlign: 'center' }}>
             <CreditCardOutlined style={{ color: '#faad14', fontSize: '24px', marginRight: '8px' }} />
             ポイント不足
           </div>
        }
        open={showInsufficientCreditsModal}
        onCancel={() => setShowInsufficientCreditsModal(false)}
        footer={null}
        centered
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            background: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
                         <Text style={{ fontSize: '16px', color: '#d48806' }}>
               動画を生成するには<strong>300ポイント</strong>が必要です。<br/>
               現在のポイント残高が不足しています。
             </Text>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                         <Button
               type="primary"
               icon={<CreditCardOutlined />}
               onClick={() => {
                 setShowInsufficientCreditsModal(false);
                 router.push('/credits/purchase');
               }}
               style={{
                 background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                 border: 'none',
                 height: '40px',
                 fontSize: '16px',
                 fontWeight: 'bold'
               }}
             >
               ポイント購入
             </Button>
            <Button
              onClick={() => setShowInsufficientCreditsModal(false)}
              style={{ height: '40px', fontSize: '16px' }}
            >
              キャンセル
            </Button>
          </div>
        </div>
      </Modal>

      {/* 登录弹窗 */}
      <LoginModal 
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(userData) => {
          setUser(userData.user);
          setIsAuthenticated(true);
          setShowLoginModal(false);
          message.success('ログインに成功しました');
        }}
      />

    </Layout>
  );
}

// 登录弹窗组件接口
interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: { user: IUser; token: string }) => void;
}

// 视频历史卡片组件
interface VideoHistoryCardProps {
  video: IVideo;
  index: number;
  onPlay: (video: IVideo) => void;
  generateThumbnail: (videoUrl: string, videoId: string) => Promise<string>;
  cachedThumbnail?: string | undefined;
  downloadVideo: (videoUrl: string, filename?: string) => Promise<void>;
}

function VideoHistoryCard({ video, index, onPlay, generateThumbnail, cachedThumbnail, downloadVideo }: VideoHistoryCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(cachedThumbnail || '');
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 监听缓存变化
  useEffect(() => {
    if (cachedThumbnail && cachedThumbnail !== thumbnailUrl) {
      console.log(`✅ Using cached thumbnail for video ${video.id}`);
      setThumbnailUrl(cachedThumbnail);
    }
  }, [cachedThumbnail, video.id, thumbnailUrl]);

  // 计算剩余天数
  const getRemainingDays = () => {
    if (!video.kieAiExpiresAt && !video.localExpiresAt) {
      // 如果没有过期时间，计算从创建时间开始的14天
      const createdDate = new Date(video.createdAt);
      const expiresDate = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const diffTime = expiresDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    const expiresAt = video.kieAiExpiresAt || video.localExpiresAt;
    if (!expiresAt) return 0;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // 生成缩略图
  useEffect(() => {
    if (!thumbnailUrl && video.videoUrl && !thumbnailLoading) {
      console.log(`🎬 Starting thumbnail generation for video ${video.id}`);
      setThumbnailLoading(true);
      generateThumbnail(video.videoUrl, video.id)
        .then(url => {
          console.log(`✅ Generated thumbnail for video ${video.id}:`, url ? 'Success' : 'Failed');
          if (url) {
            setThumbnailUrl(url);
          }
        })
        .catch(error => {
          console.error(`❌ Failed to generate thumbnail for video ${video.id}:`, error);
          // 使用默认占位图
          setThumbnailUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5WaWRlbzwvdGV4dD48L3N2Zz4=');
        })
        .finally(() => {
          setThumbnailLoading(false);
        });
    }
  }, [video.videoUrl, video.id, thumbnailUrl, thumbnailLoading, generateThumbnail]);

  // 处理鼠标悬停播放
  const handleMouseEnter = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const wasPaused = videoRef.current.paused;
      const originalMuted = videoRef.current.muted;
      
      // 保持声音播放预览（不再强制静音）
      videoRef.current.play().catch(console.error);
      
      // 保存原始状态
      videoRef.current.dataset.originalTime = currentTime.toString();
      videoRef.current.dataset.wasPaused = wasPaused.toString();
      videoRef.current.dataset.originalMuted = originalMuted.toString();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      // 恢复原始状态
      const originalTime = parseFloat(videoRef.current.dataset.originalTime || '0');
      const wasPaused = videoRef.current.dataset.wasPaused === 'true';
      const originalMuted = videoRef.current.dataset.originalMuted === 'true';
      
      videoRef.current.currentTime = originalTime;
      videoRef.current.muted = originalMuted; // 恢复原始音量状态
      
      if (wasPaused) {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div>
      <Card style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: index === 0 ? '2px solid #e60033' : '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
      {index === 0 && (
              <div style={{
                position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
          color: '#ffffff',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          最新
              </div>
      )}
      
      {/* 视频预览 */}
      <div 
        style={{
          width: '100%',
          height: '500px', // 增加高度从450px到500px
          borderRadius: '12px',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
          background: '#000000'
        }}
      >
        {thumbnailLoading ? (
          <div style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* HTML5 原生视频控件 */}
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={thumbnailUrl}
              controls
              preload="metadata"
              muted={false}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onLoadedMetadata={(e) => {
                // 确保视频元数据加载完成
                const videoElement = e.target as HTMLVideoElement;
                if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
                  console.log('Desktop video metadata loaded:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                }
                // 确保视频默认不静音
                videoElement.muted = false;
              }}
              onError={(e) => {
                console.error('Desktop video load error:', e);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                backgroundColor: '#000',
                borderRadius: '12px',
                display: 'block'
              }}
            />
            
            {/* 全屏播放按钮 */}
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 1002
            }}>
              <Button
                type="text"
                icon={<FullscreenOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(video);
                }}
                style={{ 
                  color: '#ffffff', 
                  fontSize: '20px', 
                  padding: '8px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '8px',
                  border: 'none'
                }}
                title="全屏播放"
              />
            </div>
          </>
        )}
      </div>
      
      {/* 视频信息 */}
      <div style={{ padding: '0 8px 8px' }}>
        <Title level={5} style={{ 
          color: '#ffffff', 
          margin: 0, 
          marginBottom: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {video.originalPrompt}
        </Title>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              {new Date(video.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <Text style={{ 
              color: getRemainingDays() <= 3 ? '#ff4d4f' : '#a0a0a0', 
              fontSize: '12px' 
            }}>
              あと{getRemainingDays()}日保存
            </Text>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ 
              color: video.status === 'completed' ? '#52c41a' : 
                     video.status === 'failed' ? '#ff4d4f' : '#ffaa00',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {video.status === 'completed' && '✅ 完了'}
              {video.status === 'processing' && '🔄 処理中'}
              {video.status === 'pending' && '⏳ 待機中'}
              {video.status === 'failed' && '❌ 失敗'}
            </Text>
            
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              {video.creditsUsed} ポイント
            </Text>
            
            {/* 下载按钮移到这里 */}
            {video.status === 'completed' && video.videoUrl && (
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (video.videoUrl) {
                    const filename = `${video.originalPrompt.substring(0, 20)}_${new Date().getTime()}.mp4`;
                    downloadVideo(video.videoUrl, filename);
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '11px',
                  height: '24px',
                  paddingLeft: '8px',
                  paddingRight: '8px'
                }}
              >
                ダウンロード
              </Button>
            )}
            </div>
          </div>
        
        {/* 移除翻译内容显示 */}
        {false && video.translatedPrompt && video.translatedPrompt !== video.originalPrompt && (
          <Text style={{ 
            color: '#a0a0a0', 
            fontSize: '11px',
            fontStyle: 'italic',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            翻訳: {video.translatedPrompt}
          </Text>
        )}
      </div>
    </Card>

    </div>
  );
}

// 登录弹窗组件
function LoginModal({ visible, onClose, onLoginSuccess }: LoginModalProps) {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  // Google OAuth登录处理
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 获取Google OAuth授权URL
      const response = await fetch('/api/auth/google', {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 重定向到Google授权页面
          window.location.href = result.data.authUrl;
        } else {
          message.error('Google OAuth設定エラー');
        }
      } else {
        message.error('Google OAuth接続に失敗しました');
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      message.error('Google OAuth処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };



  const handleLogin = async (values: { email: string; password: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          localStorage.setItem('token', result.data.token);
          onLoginSuccess(result.data);
          form.resetFields();
        } else {
          message.error('ログインに失敗しました');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : errorData.error?.message || 'ログインに失敗しました';
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('ログインエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
            title={
        <div style={{ textAlign: 'center', background: 'transparent' }}>
          <Typography.Title level={3} style={{ margin: 0, color: '#ffffff', background: 'transparent' }}>
            ログイン
          </Typography.Title>
          <Typography.Text style={{ color: '#a0a0a0', background: 'transparent' }}>
            動画生成にはログインが必要です
          </Typography.Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={460}
      style={{
        top: '50%',
        transform: 'translateY(-50%)'
      }}
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        content: { 
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        },
        header: {
          background: 'transparent',
          borderBottom: 'none'
        }
      }}
    >
      <Form
        form={form}
        onFinish={handleLogin}
        size="large"
        layout="vertical"
        style={{ marginTop: '24px' }}
      >
        <Form.Item
          name="email"
          label={<Typography.Text style={{ color: '#ffffff' }}>メールアドレス</Typography.Text>}
          rules={[
            { required: true, message: 'メールアドレスを入力してください' },
            { type: 'email', message: '有効なメールアドレスを入力してください' }
          ]}
        >
                     <Input 
             prefix={<UserOutlined style={{ color: '#a0a0a0' }} />} 
             placeholder="メールアドレス"
             style={{
               background: 'rgba(255, 255, 255, 0.05)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               color: '#ffffff',
               padding: '16px 20px',
               fontSize: '15px',
               height: '52px'
             }}
           />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Typography.Text style={{ color: '#ffffff' }}>パスワード</Typography.Text>}
          rules={[{ required: true, message: 'パスワードを入力してください' }]}
        >
                     <Input.Password
             prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
             placeholder="パスワード"
             style={{
               background: 'rgba(255, 255, 255, 0.05)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               color: '#ffffff',
               padding: '16px 20px',
               fontSize: '15px',
               height: '52px'
             }}
           />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            style={{
              width: '100%',
              height: '48px',
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </Form.Item>

        {/* OAuth登录分隔线 */}
        <div style={{ margin: '24px 0', textAlign: 'center' }}>
          <div style={{ position: 'relative', height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}>
            <span style={{ 
              position: 'absolute', 
              left: '50%', 
              top: '50%', 
              transform: 'translate(-50%, -50%)',
              background: 'rgba(26, 26, 26, 0.95)',
              padding: '0 16px',
              color: '#a0a0a0',
              fontSize: '12px'
            }}>
              または
            </span>
          </div>
        </div>

        {/* OAuth登录按钮 */}
        <div style={{ marginBottom: '16px' }}>
          <Button
            type="default"
            onClick={handleGoogleLogin}
            loading={isLoading}
            style={{
              width: '100%',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#ffffff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            Googleでログイン
          </Button>


        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Typography.Text style={{ color: '#a0a0a0', marginRight: '8px' }}>
            アカウントをお持ちでない方は
          </Typography.Text>
          <Button 
            type="link" 
            onClick={() => {
              onClose();
              window.open('/auth/register', '_blank');
            }}
            style={{ 
              color: '#1890ff',
              padding: 0,
              fontSize: '14px',
              textDecoration: 'underline',
              fontWeight: '500'
            }}
          >
            新規登録
          </Button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Button 
            type="link" 
            onClick={() => {
              onClose();
              window.open('/auth/forgot-password', '_blank');
            }}
            style={{ 
              color: '#a0a0a0',
              padding: 0,
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            パスワードをお忘れですか？
          </Button>
        </div>
      </Form>
    </Modal>
  );
} 