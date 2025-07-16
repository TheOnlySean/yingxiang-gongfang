/**
 * 映像工房 - WorkingPlayground 移动端适配版本
 * 核心视频生成界面的响应式版本
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, Button, Input, message, Spin, Progress, 
  Typography, Modal, Upload, Image
} from 'antd';
import { 
  VideoCameraOutlined, 
  LogoutOutlined, 
  HistoryOutlined, 
  PlayCircleOutlined,
  DownloadOutlined, 
  UserOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  InboxOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { IUser, IVideo } from '@/types';
// 临时移除MobileAuthSystem导入，直接使用简单的登录提示
// import MobileAuthSystem from './MobileAuthSystem';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// 定义上传图片的类型
interface IUploadedImage {
  id: string;
  url: string;
  name: string;
}

export default function WorkingPlaygroundMobile() {
  const router = useRouter();
  
  // 用户状态
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 视频生成状态
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<'preparing' | 'waiting' | 'polling' | 'completed'>('preparing');
  const [isUpdating, setIsUpdating] = useState(false);

  // 视频历史相关状态
  const [videoHistory, setVideoHistory] = useState<IVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<IVideo | null>(null);

  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<IUploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // 常量配置
  const VIDEOS_PER_PAGE = 3;

  // 加载视频历史
  const loadVideoHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/videos?limit=${VIDEOS_PER_PAGE}&offset=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Videos API response:', result); // 添加调试日志
        const videos = result.data?.videos || [];
        setVideoHistory(videos);
        console.log('Loaded videos:', videos); // 添加调试日志
      } else {
        console.error('Failed to load video history:', response.status);
        message.error('動画履歴の読み込みに失敗しました');
      }
    } catch (error) {
      console.error('Load video history error:', error);
      message.error('動画履歴の読み込みエラー');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // 图片上传处理
  const handleImageUpload = async (file: File): Promise<void> => {
    if (!file.type.startsWith('image/')) {
      message.error('画像ファイルをアップロードしてください');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error('ファイルサイズは10MB以下にしてください');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('files', file); // 修改为 'files' 以匹配API期望

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('上传API响应:', data);
        
        // 检查响应格式
        if (data.success && data.data && data.data.uploads && data.data.uploads.length > 0) {
          const uploadResult = data.data.uploads[0];
          if (uploadResult.success) {
            const newImage: IUploadedImage = {
              id: Date.now().toString(),
              url: uploadResult.imageUrl,
              name: file.name
            };
            setUploadedImages(prev => [...prev, newImage]);
            message.success('画像をアップロードしました');
            console.log('💡 画像アップロード成功！動画生成がうまくいかない場合は、風景や動物などの画像をお試しください。');
          } else {
            message.error(`画像アップロード失敗: ${uploadResult.error}`);
          }
        } else {
          message.error('画像アップロードに失敗しました');
        }
      } else {
        const errorData = await response.json();
        console.error('アップロード失敗:', errorData);
        message.error(`画像アップロード失敗: ${errorData.error?.message || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      message.error('画像アップロードエラー');
    } finally {
      setIsUploading(false);
    }
  };

  // 视频生成相关函数
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('プロンプトを入力してください');
      return;
    }
    if (!isAuthenticated || !user) {
      message.info('動画を生成するにはログインが必要です');
      return;
    }
    if (user.credits < 300) {
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
        ...(seed.trim() && { seed: seed.trim() })
      };
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
        const taskId = data.data?.taskId;
        if (!taskId) {
          message.error('動画生成に失敗しました：タスクIDを取得できませんでした');
          setIsGenerating(false);
          return;
        }
        setGenerationStage('waiting');
        setGenerationProgress(5);
        // 进度条平滑推进
        const waitTime = 30000;
        const totalPollingTime = 240000;
        const progressUpdateInterval = 2000;
        const progressIncrement = 90 / (totalPollingTime / progressUpdateInterval);
        let progressInterval: any = null;
        progressInterval = setInterval(() => {
          setGenerationProgress(prev => {
            const newProgress = prev + progressIncrement;
            if (newProgress >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return newProgress;
          });
        }, progressUpdateInterval);
        setTimeout(() => {
          setGenerationStage('polling');
          startPolling(taskId, progressInterval);
        }, waitTime);
      } else {
        const errorData = await response.json();
        const errorMessage = typeof errorData.error === 'string' ? errorData.error : errorData.error?.message || '動画生成に失敗しました';
        message.error(errorMessage);
        setIsGenerating(false);
      }
    } catch (error) {
      message.error('動画生成エラーが発生しました');
      setIsGenerating(false);
    }
  };

  // 用户认证检查
  const checkAuth = useCallback(async () => {
    console.log('🔍 WorkingPlaygroundMobile - checkAuth 开始');
    try {
      const token = localStorage.getItem('token');
      console.log('📱 Token from localStorage:', token ? 'Token存在' : 'Token为空');
      
      if (!token) {
        console.log('❌ 没有token，设置为未认证状态');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      console.log('🌐 发送认证验证请求...');
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📊 认证验证响应状态:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ 认证成功，用户数据:', {
          id: userData.id,
          email: userData.email,
          credits: userData.credits
        });
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ 认证失败，状态:', response.status);
        const errorData = await response.text();
        console.log('❌ 认证失败详情:', errorData);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('💥 认证检查异常:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('🏁 checkAuth 完成');
    }
  }, []);

  // 处理登出
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setVideoHistory([]);
    setUploadedImages([]);
    message.success('ログアウトしました');
  }, []);

  // 购买积分
  const handlePurchaseCredits = () => {
    router.push('/credits/purchase');
  };

  // 视频播放相关函数
  const handlePlayVideo = (video: IVideo) => {
    setCurrentPlayingVideo(video);
    setVideoPlayerVisible(true);
  };

  // 下载视频
  const downloadVideo = useCallback(async (video: IVideo) => {
    try {
      if (!video.videoUrl) {
        message.error('動画URLが見つかりません');
        return;
      }

      message.loading('ダウンロード準備中...', 0.5);
      
      // 获取视频文件
      const response = await fetch(video.videoUrl);
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
      const filename = `${video.originalPrompt.substring(0, 20)}_${new Date().getTime()}.mp4`;
      link.download = filename;
      
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

  // 处理认证成功 - 现在简化为跳转到登录页面

  // 1. 完全同步桌面端的handleGenerate逻辑
  // 2. 完全同步桌面端的startPolling逻辑
  const startPolling = async (taskId: string, progressInterval: any) => {
    const maxAttempts = 80;
    let attempts = 0;
    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGenerating(false);
        setGenerationStage('completed');
        message.error('動画生成がタイムアウトしました。履歴からご確認ください。');
        clearInterval(progressInterval);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/status/${taskId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const videoData = data.data;
          if (videoData?.status === 'completed') {
            setGenerationProgress(100);
            setGenerationStage('completed');
            setIsGenerating(false);
            clearInterval(progressInterval);
            setTimeout(() => { refreshHistoryInternal(false); }, 1000);
            setPrompt('');
            setSeed('');
            setUploadedImages([]);
            message.success('動画生成が完了しました！履歴からご確認ください。');
            // 刷新用户信息
            const userResponse = await fetch('/api/auth/verify', { headers: { 'Authorization': `Bearer ${token}` } });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData);
            }
            return;
          } else if (videoData?.status === 'failed') {
            setIsGenerating(false);
            setGenerationStage('completed');
            clearInterval(progressInterval);
            const errorMessage = typeof videoData.error === 'string' ? videoData.error : videoData.error?.message || '動画生成に失敗しました';
            message.error(errorMessage);
            return;
          }
        }
      } catch (error) {
        // 忽略单次错误
      }
      attempts++;
      setTimeout(poll, 15000);
    };
    poll();
  };

  // 3. 完全同步桌面端的refreshHistoryInternal逻辑
  const refreshHistoryInternal = useCallback(async (isManualRefresh: boolean = true) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
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
          if (data.completedVideos > 0) message.success(`${data.completedVideos}本の動画生成が完了しました！`);
          if (data.failedVideos > 0) message.warning(`${data.failedVideos}本の動画生成に失敗しました。`);
          if (data.completedVideos === 0 && data.failedVideos === 0) message.info(`${data.updatedCount}本の動画状況を確認しました。`);
        } else {
          if (isManualRefresh) message.info('確認中の動画はありません');
        }
      }
    } catch (error) {
      // 批量更新失败不影响刷新历史
    }
    loadVideoHistory();
    setIsUpdating(false);
  }, [isUpdating, loadVideoHistory]);

  // 4. “更新”按钮点击逻辑
  const handleRefreshHistory = useCallback(() => {
    refreshHistoryInternal(true);
  }, [refreshHistoryInternal]);

  // 初始化
  useEffect(() => {
    console.log('WorkingPlaygroundMobile initializing...'); // 添加调试日志
    checkAuth();
  }, [checkAuth]);

  // 加载视频历史
  useEffect(() => {
    console.log('Check video history load:', { isAuthenticated, user: !!user }); // 添加调试日志
    if (isAuthenticated && user) {
      loadVideoHistory();
    }
  }, [isAuthenticated, user]); // 移除 loadVideoHistory 依赖，因为它已经使用useCallback处理了依赖

  // 添加窗口焦点监听，用于当用户从其他页面返回时刷新用户信息
  useEffect(() => {
    let lastFocusTime = 0;
    const handleWindowFocus = () => {
      const now = Date.now();
      // 防止频繁触发，至少间隔5秒
      if (now - lastFocusTime < 5000) {
        return;
      }
      lastFocusTime = now;
      
      if (isAuthenticated && user && !isUploading && !isGenerating) {
        console.log('Window focused, refreshing user data...');
        checkAuth();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isAuthenticated, user, checkAuth, isUploading, isGenerating]); // 添加上传和生成状态作为依赖

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: '#ffffff' }}>
          読み込み中...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* 头部 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '600'
          }}>
            映像工房
          </h1>
          <span style={{ 
            color: '#ff6b7a', 
            fontSize: '12px',
            fontWeight: '400',
            opacity: 0.9
          }}>
            想像を映像に変える魔法
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated && user ? (
            <>
              {/* 用户信息 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                color: '#ffffff',
                fontSize: '12px'
              }}>
                <UserOutlined />
                <span>{user.email?.split('@')[0] || 'User'}</span>
              </div>
              
              {/* 积分显示 */}
              <Button
                type="text"
                icon={<ThunderboltOutlined />}
                onClick={handlePurchaseCredits}
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  minWidth: 'auto',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {user.credits || 0}
              </Button>
              
              {/* 登出按钮 */}
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  minWidth: 'auto',
                  height: 'auto',
                }}
              />
            </>
          ) : (
            <div style={{ 
              color: '#a0a0a0', 
              fontSize: '12px' 
            }}>
              ログインしていません
            </div>
          )}
        </div>
      </div>

      {/* 主内容 */}
      {!isAuthenticated ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            color: '#ffffff'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <UserOutlined style={{ fontSize: '48px', color: '#e60033' }} />
            </div>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
              ログインが必要です
            </Title>
            <Text style={{ color: '#a0a0a0', marginBottom: '20px', display: 'block' }}>
              動画生成と履歴確認にはログインが必要です
            </Text>
            <Button
              type="primary"
              onClick={() => router.push('/auth/login')}
              style={{
                background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 24px',
                fontSize: '16px',
                height: '44px',
              }}
            >
              ログインページへ
            </Button>
          </Card>
        </div>
      ) : (
        <>
          {/* 第一部分：设置模块 */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              marginBottom: '16px',
            }}>
              <h3 style={{ 
                color: '#ffffff', 
                margin: 0, 
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <VideoCameraOutlined />
                設定
              </h3>
            </div>

            {/* 提示词输入 */}
            <Card
              title={
                <span style={{ color: '#ffffff' }}>
                  <VideoCameraOutlined style={{ marginRight: '8px' }} />
                  動画生成プロンプト（説明文）
                </span>
              }
              style={{
                marginBottom: '16px',
                background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.1), rgba(255, 107, 122, 0.1))',
                border: '1px solid rgba(230, 0, 51, 0.3)',
                borderRadius: '12px',
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

              {/* 生成按钮 */}
              <Button
                type="primary"
                size="large"
                loading={isGenerating}
                onClick={handleGenerate}
                disabled={!prompt.trim()}
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
              
              {user && (user.credits ?? 0) < 300 && (
                <Text style={{ color: '#ff4d4f', textAlign: 'center', display: 'block', marginTop: '8px' }}>
                  ポイントが不足しています（300ポイント必要）
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
                marginBottom: '16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
              }}
            >
              <Dragger
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleImageUpload}
                disabled={isUploading}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  minHeight: uploadedImages.length > 0 ? '200px' : '120px',
                  padding: uploadedImages.length > 0 ? '0' : '16px',
                  marginBottom: '12px',
                }}
              >
                {uploadedImages.length === 0 ? (
                  // 显示上传提示
                  <>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ fontSize: '36px', color: '#ffffff' }} />
                    </p>
                    <p className="ant-upload-text" style={{ color: '#ffffff' }}>
                      画像をクリックまたはドラッグしてアップロード
                    </p>
                    <p className="ant-upload-hint" style={{ color: '#a0a0a0' }}>
                      PNG、JPG、JPEG形式対応（最大10MB）
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
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>
                          タップして画像を変更
                        </Text>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button
                            size="small"
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (uploadedImages[0]?.url) {
                                // 简单的预览功能
                                Modal.info({
                                  title: '画像プレビュー',
                                  content: (
                                    <Image
                                      src={uploadedImages[0].url}
                                      alt={uploadedImages[0].name}
                                      style={{ width: '100%' }}
                                    />
                                  ),
                                  width: '80%',
                                  style: { top: 20 }
                                });
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
                              setUploadedImages([]);
                              message.success('画像を削除しました');
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

                      {/* 底部信息 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <Text style={{ 
                          color: '#ffffff', 
                          fontSize: '10px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                        }}>
                          {uploadedImages[0]?.name || ''}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}
              </Dragger>
            </Card>

            {/* 生成进度 */}
            {isGenerating && (
              <Card
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#ffffff', fontSize: '14px' }}>
                    生成進度: {generationProgress}%
                  </span>
                </div>
                <Progress
                  percent={generationProgress}
                  strokeColor={{
                    '0%': '#e60033',
                    '100%': '#ff6b7a',
                  }}
                  trailColor="rgba(255, 255, 255, 0.1)"
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ color: '#a0a0a0', fontSize: '12px' }}>
                  {generationStage === 'preparing' && '準備中...'}
                  {generationStage === 'waiting' && '高品質な動画を生成中です'}
                  {generationStage === 'polling' && '動画を生成中...'}
                  {generationStage === 'completed' && '✅ 動画生成完了！'}
                </div>
              </Card>
            )}
          </div>

          {/* 第二部分：动画历史 */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            minHeight: '50vh',
          }}>
            <div style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ 
                color: '#ffffff', 
                margin: 0, 
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <HistoryOutlined />
                履歴
              </h3>
              <Button
                type="text"
                onClick={handleRefreshHistory}
                style={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '12px',
                }}
              >
                更新
              </Button>
            </div>

            {/* 历史记录列表 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Spin size="large" />
                  <Text style={{ color: '#a0a0a0', display: 'block', marginTop: '16px' }}>
                    履歴を読み込み中...
                  </Text>
                </div>
              ) : videoHistory.length > 0 ? (
                videoHistory.map((video) => (
                  <Card
                    key={video.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                    }}
                  >
                    {/* 视频预览区域 */}
                    {video.status === 'completed' && video.videoUrl ? (
                      <div
                        style={{
                          width: '100%',
                          height: '200px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          background: '#000000',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        onClick={() => handlePlayVideo(video)}
                      >
                        <video
                          src={video.videoUrl}
                          muted
                          preload="metadata"
                          poster={video.thumbnailUrl}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                          }}
                        />
                        
                        {/* 播放按钮覆盖层 */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'opacity 0.2s ease',
                        }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                          }}>
                            <PlayCircleOutlined style={{
                              fontSize: '32px',
                              color: '#e60033',
                              marginLeft: '4px' // 调整播放图标位置
                            }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '200px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <VideoCameraOutlined style={{
                          fontSize: '48px',
                          color: video.status === 'failed' ? '#ff4d4f' : '#1890ff',
                        }} />
                      </div>
                    )}

                    {/* 视频信息 */}
                    <div style={{ padding: '12px' }}>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4',
                      }}>
                        {video.originalPrompt}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}>
                        <div style={{
                          color: '#a0a0a0',
                          fontSize: '12px',
                        }}>
                          {new Date(video.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{
                            color: video.status === 'completed' ? '#52c41a' : 
                                  video.status === 'failed' ? '#ff4d4f' : '#1890ff',
                            fontSize: '12px',
                          }}>
                            {video.status === 'completed' ? '完了' : 
                             video.status === 'failed' ? '失敗' : '処理中'}
                          </span>
                          <span style={{ color: '#a0a0a0', fontSize: '12px' }}>
                            {video.creditsUsed} ポイント
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      {video.status === 'completed' && video.videoUrl && (
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'flex-end',
                        }}>
                          <Button
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handlePlayVideo(video)}
                            style={{
                              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              height: '32px',
                            }}
                          >
                            再生
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => downloadVideo(video)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              color: '#ffffff',
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              height: '32px',
                            }}
                          >
                            ダウンロード
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{
                    width: '100px',
                    height: '100px',
                    margin: '0 auto 32px',
                    background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.2), rgba(255, 107, 122, 0.2))',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <VideoCameraOutlined style={{ fontSize: '48px', color: '#e60033' }} />
                  </div>
                  
                  <Title level={3} style={{ 
                    marginBottom: '16px', 
                    color: '#ffffff',
                    fontWeight: '300'
                  }}>
                    まだ動画がありません
                  </Title>
                  
                  <Text style={{ 
                    color: '#a0a0a0',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    marginBottom: '24px',
                    display: 'block'
                  }}>
                    最初の動画を生成してみましょう
                  </Text>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 积分不足弹窗 */}
      <Modal
        title="ポイントが不足しています"
        open={showInsufficientCreditsModal}
        onCancel={() => setShowInsufficientCreditsModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowInsufficientCreditsModal(false)}>
            キャンセル
          </Button>,
          <Button key="purchase" type="primary" onClick={handlePurchaseCredits}>
            ポイントを購入
          </Button>
        ]}
      >
        <p>動画を生成するには<strong>300ポイント</strong>が必要です。</p>
        <p>現在のポイント: {user?.credits || 0}</p>
      </Modal>

      {/* 视频播放器 */}
      <Modal
        title="動画再生"
        open={videoPlayerVisible}
        onCancel={() => setVideoPlayerVisible(false)}
        footer={null}
        width="90%"
        style={{ 
          top: 20,
        }}
        styles={{
          header: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          },
          body: {
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '0',
          },
          content: {
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
          },
        }}
        closeIcon={
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            ×
          </div>
        }
      >
        {currentPlayingVideo && (
          <video
            src={currentPlayingVideo.videoUrl || ''}
            controls
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              background: '#000000',
            }}
          />
        )}
      </Modal>
    </div>
  );
} 