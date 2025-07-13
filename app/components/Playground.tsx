'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Upload, 
  Button, 
  Input, 
  Typography, 
  Space, 
  Image,
  Row,
  Col,
  Progress,
  message,
  Modal,
  Spin,
  Form
} from 'antd';
import { 
  InboxOutlined, 
  PlayCircleOutlined, 
  DownloadOutlined,
  SlidersOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  StarOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { IUploadedImage, IVideo, IUser } from '@/types';

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Playground Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          <div>
            <h2>组件加载出错</h2>
            <p>错误信息: {this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 动态导入子组件
const VideoHistoryCard = React.lazy(() => import('./VideoHistoryCard'));
const PremiumUpgradeModal = React.lazy(() => import('./PremiumUpgradeModal'));

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Dragger } = Upload;

function PlaygroundInner() {
  console.log('Playground component loading...');

  // ===== 所有 Hooks 必须在条件渲染之前定义 =====
  
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginForm] = Form.useForm();

  // 其他状态
  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState('');
  const [uploadedImages, setUploadedImages] = useState<IUploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<IVideo | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 计算剩余天数的辅助函数
  const getRemainingDays = (expiresAt: string) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };
  
  // 视频历史记录
  const [videoHistory, setVideoHistory] = useState<IVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 获取用户视频历史记录
  const fetchVideoHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching video history for user:', user.id);
      
      const response = await fetch('/api/videos?limit=20&offset=0', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Video history response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Video history result:', result);
        
        if (result.success && result.data) {
          // 处理返回的视频数据，添加过期时间等字段
          const processedVideos = result.data.videos.map((video: any) => ({
            ...video,
            // 根据KIE.AI的14天存储规则计算过期时间
            kieAiExpiresAt: video.kieAiExpiresAt || new Date(new Date(video.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            localExpiresAt: video.localExpiresAt || new Date(new Date(video.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            storageStatus: video.storageStatus || 'kie_ai_only'
          }));
          
          console.log('Processed videos:', processedVideos);
          setVideoHistory(processedVideos);
          message.success(`視頻履歴を取得しました (${processedVideos.length}件)`);
        }
      } else {
        console.error('Failed to fetch video history:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        message.error('視頻履歴の取得に失敗しました');
      }
    } catch (error) {
      console.error('Error fetching video history:', error);
      message.error('視頻履歴の取得に失敗しました');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);
  
  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File): Promise<boolean> => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('files', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data?.uploads?.[0]?.success) {
        const imageUrl = result.data.uploads[0].imageUrl;
        const newImage: IUploadedImage = {
          uid: file.name + Date.now(),
          name: file.name,
          url: imageUrl,
          file
        };
        
        setUploadedImages(prev => [...prev, newImage]);
        message.success(`${file.name} 上传成功！`);
        return true;
      } else {
        const error = result.data?.uploads?.[0]?.error || result.error?.message || '上传失败';
        message.error(`上传失败: ${error}`);
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('上传失败，请检查网络连接');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // 移除图片
  const handleRemoveImage = useCallback((uid: string) => {
    setUploadedImages(prev => prev.filter(img => img.uid !== uid));
  }, []);

  // 预览图片
  const handlePreviewImage = useCallback((url: string) => {
    setPreviewImage(url);
    setPreviewVisible(true);
  }, []);

  // 处理视频历史记录
  const handlePlayHistoryVideo = useCallback((video: IVideo) => {
    setCurrentVideo(video);
  }, []);

  const handleDownloadVideo = useCallback((video: IVideo) => {
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `video-${video.id}.mp4`;
      link.click();
    }
  }, []);

  const handleUpgradeClick = useCallback(() => {
    setShowUpgradeModal(true);
  }, []);

  const handleUpgradeConfirm = useCallback(() => {
    // 这里实现升级逻辑
    message.info('升级功能开发中...');
    setShowUpgradeModal(false);
  }, []);

  // 轮询检查生成状态
  const pollVideoStatus = useCallback(async (taskId: string) => {
    const maxPolls = 100; // 最多轮询100次（约8分钟）
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/status/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const result = await response.json();

        if (result.success && result.data) {
          const video = result.data as IVideo;
          setCurrentVideo(video);

          switch (video.status) {
            case 'pending':
            case 'processing':
              // 更新进度（基于时间估算，前60次到90%，后面缓慢增长）
              const progress = pollCount < 60 
                ? Math.min(90, (pollCount / 60) * 90)
                : Math.min(98, 90 + ((pollCount - 60) / 40) * 8);
              setGenerationProgress(progress);
              
              pollCount++;
              if (pollCount < maxPolls) {
                // 保持较快的轮询频率：每5秒轮询一次
                setTimeout(poll, 5000);
              } else {
                message.warning('生成时间超过预期，请稍后查看结果');
                setIsGenerating(false);
              }
              break;

            case 'completed':
              setGenerationProgress(100);
              setIsGenerating(false);
              message.success('视频生成完成！');
              // 刷新视频历史记录
              fetchVideoHistory();
              break;

            case 'failed':
              setIsGenerating(false);
              message.error(`生成失败: ${video.errorMessage || '未知错误'}`);
              break;

            default:
              pollCount++;
              if (pollCount < maxPolls) {
                setTimeout(poll, 5000); // 保持5秒间隔
              }
          }
        } else {
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(poll, 5000);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  }, []);

  // 生成视频
  const handleGenerateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      message.warning('请输入视频描述');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentVideo(null);

    try {
      const requestBody = {
        originalPrompt: prompt.trim(),
        imageUrls: uploadedImages.map(img => img.url),
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const video = result.data as IVideo;
        setCurrentVideo(video);
        message.success('视频生成请求已提交！');
        
        // 开始轮询状态
        pollVideoStatus(video.taskId);
      } else {
        setIsGenerating(false);
        const errorMessage = result.error?.message || '生成失败';
        message.error(`生成失败: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setIsGenerating(false);
      message.error('生成失败，请检查网络连接');
    }
  }, [prompt, uploadedImages, pollVideoStatus]);

  // 处理登录
  const handleLogin = useCallback(async (values: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('token', result.data.token);
        setUser({
          ...result.data.user,
          plan: result.data.user.plan || 'free'
        });
        setIsAuthenticated(true);
        message.success('ログインに成功しました！');
        
        // 获取用户视频历史记录
        setTimeout(() => {
          fetchVideoHistory();
        }, 100);
      } else {
        message.error(`ログインに失敗しました: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('ログインに失敗しました。ネットワークをご確認ください');
    }
  }, []);

  // 处理登出
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentVideo(null);
    setUploadedImages([]);
    setPrompt('');
    message.success('ログアウトしました');
  }, []);

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // 这里可以调用 /api/auth/me 来验证token
        // 为了简化，先假设有token就是已登录
        const mockUser: IUser = {
          id: '1',
          email: 'test@example.com',
          credits: 100,
          totalUsed: 0,
          videosGenerated: 0,
          isActive: true,
          plan: 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        setIsLoading(false);
        
        // 获取用户视频历史记录
        setTimeout(() => {
          fetchVideoHistory();
        }, 100);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ===== 条件渲染逻辑 =====

  // 如果正在加载，显示加载界面
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
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
        </Header>
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '50px'
        }}>
          <Card style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2}>ログイン</Title>
              <Text type="secondary">映像工房にようこそ</Text>
            </div>
            <Form
              form={loginForm}
              onFinish={handleLogin}
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'メールアドレスを入力してください' },
                  { type: 'email', message: '有効なメールアドレスを入力してください' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="メールアドレス" 
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'パスワードを入力してください' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  placeholder="パスワード" 
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  style={{ width: '100%' }}
                >
                  ログイン
                </Button>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                テスト用: test@example.com / password123
              </Text>
            </div>
          </Card>
        </Content>
      </Layout>
    );
  }

  // ===== 主应用界面 =====

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file: File) => {
      handleImageUpload(file);
      return false; // 阻止自动上传
    },
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 日式头部导航 */}
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(42, 42, 42, 0.5)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
            想像を動画に変える魔法
          </Text>
        </div>
        
        <Space size="middle">
          <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
            {user?.email} | クレジット: {user?.credits ?? 0}
          </Text>
          <Button type="text" icon={<StarOutlined />}>
            お気に入り
          </Button>
          <Button type="text" icon={<DownloadOutlined />}>
            ダウンロード
          </Button>
          <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
            ログアウト
          </Button>
        </Space>
      </Header>

      <Layout>
        {/* 左侧设置面板 */}
        <Sider 
          width={450} 
          style={{ 
            background: 'rgba(26, 26, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            borderRight: '1px solid rgba(42, 42, 42, 0.5)',
            overflow: 'auto'
          }}
        >
          <div className="ma-space-lg">
            {/* 图片上传区域 */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PictureOutlined style={{ color: '#e60033' }} />
                  <span>画像 (optional)</span>
                  {isUploading && <Spin size="small" />}
                </div>
              }
              style={{ marginBottom: '24px' }}
            >
              <Dragger {...uploadProps} style={{ marginBottom: '16px' }} disabled={isUploading}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: '48px', color: '#e60033' }} />
                </p>
                <p className="ant-upload-text" style={{ fontSize: '16px', fontWeight: '500', color: '#e60033' }}>
                  ドラッグ&ドロップまたはクリックして画像をアップロード
                </p>
                <p className="ant-upload-hint" style={{ fontSize: '12px', color: '#a0a0a0' }}>
                  対応形式：JPG、JPEG、PNG、GIF、WebP；各ファイル最大10MB
                </p>
              </Dragger>

              {/* 上传的图片预览 */}
              {uploadedImages.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text style={{ fontSize: '12px', color: '#a0a0a0', marginBottom: '8px', display: 'block' }}>
                    アップロード済み画像 ({uploadedImages.length}):
                  </Text>
                  <Row gutter={[8, 8]}>
                    {uploadedImages.map((img) => (
                      <Col span={8} key={img.uid}>
                        <div style={{ position: 'relative' }}>
                          <Image
                            src={img.url}
                            alt={img.name}
                            style={{ 
                              width: '100%', 
                              height: '60px', 
                              objectFit: 'cover',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            preview={false}
                            onClick={() => handlePreviewImage(img.url)}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            display: 'flex',
                            gap: '4px'
                          }}>
                            <Button
                              size="small"
                              type="text"
                              icon={<EyeOutlined />}
                              style={{ 
                                background: 'rgba(0,0,0,0.5)', 
                                color: 'white',
                                border: 'none',
                                padding: '2px 4px',
                                minWidth: 'auto'
                              }}
                              onClick={() => handlePreviewImage(img.url)}
                            />
                            <Button
                              size="small"
                              type="text"
                              icon={<DeleteOutlined />}
                              style={{ 
                                background: 'rgba(230,0,51,0.8)', 
                                color: 'white',
                                border: 'none',
                                padding: '2px 4px',
                                minWidth: 'auto'
                              }}
                              onClick={() => handleRemoveImage(img.uid)}
                            />
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}
            </Card>

            {/* 提示词输入 */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <VideoCameraOutlined style={{ color: '#e60033' }} />
                  <span>動画生成プロンプト</span>
                </div>
              }
              style={{ marginBottom: '24px' }}
            >
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="動画の内容を詳しく記述してください...&#10;例: 桜の花びらが風に舞う美しい春の風景"
                rows={6}
                style={{ 
                  resize: 'none',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}
                disabled={isGenerating}
                maxLength={500}
              />
              <div style={{ 
                marginTop: '12px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: '12px', color: '#666666' }}>
                  {prompt.length}/500 文字
                </Text>
                <Button size="small" type="text">
                  例を見る
                </Button>
              </div>
            </Card>

            {/* 设置选项 */}
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersOutlined style={{ color: '#e60033' }} />
                  <span>生成設定</span>
                </div>
              }
              style={{ marginBottom: '24px' }}
            >
              <div>
                <Text style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  marginBottom: '12px',
                  display: 'block'
                }}>
                  シード値 (オプション)
                </Text>
                <Input
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="例: 12345"
                  style={{ marginBottom: '8px' }}
                  disabled={isGenerating}
                />
                <Text style={{ fontSize: '12px', color: '#666666' }}>
                  同じシード値で同様の結果を再現できます
                </Text>
              </div>
            </Card>

            {/* 生成按钮 */}
            <div style={{ marginBottom: '24px' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<PlayCircleOutlined />}
                style={{ 
                  width: '100%',
                  height: '56px',
                  fontSize: '16px',
                  fontWeight: '600',
                  letterSpacing: '0.02em'
                }}
                disabled={!prompt.trim() || isGenerating}
                loading={isGenerating}
                onClick={handleGenerateVideo}
              >
                {isGenerating ? '生成中...' : '動画を生成する'}
              </Button>

              {!isGenerating && (
                <Text style={{ 
                  fontSize: '12px', 
                  color: '#666666',
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '12px'
                }}>
                  生成には約2-5分かかります
                </Text>
              )}
            </div>
          </div>
        </Sider>

        {/* 右侧视频列表区域 */}
        <Content style={{ padding: 0 }}>
          <div 
            className="video-history-scroll"
            style={{ 
              height: 'calc(100vh - 64px)',
              overflowY: 'auto',
              padding: '20px',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}
          >
            {/* 当前生成进度 */}
            {isGenerating && (
              <div style={{ 
                marginBottom: '20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '40px 20px',
                backdropFilter: 'blur(8px)',
                border: '2px solid #e60033',
                boxShadow: '0 0 20px rgba(230, 0, 51, 0.3)'
              }}>
                <div style={{
                  width: '160px',
                  height: '160px',
                  margin: '0 auto 40px',
                  background: 'linear-gradient(135deg, rgba(230, 0, 51, 0.3), rgba(255, 107, 122, 0.3))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(230, 0, 51, 0.5)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ffffff'
                  }}>
                    {Math.round(generationProgress)}%
                  </div>
                  <VideoCameraOutlined style={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.8)' }} />
                </div>
                
                <Progress 
                  percent={Math.round(generationProgress)} 
                  status="active"
                  strokeColor={{
                    '0%': '#e60033',
                    '100%': '#ff6b7a',
                  }}
                  style={{ 
                    marginBottom: '32px',
                    maxWidth: '400px',
                    margin: '0 auto 32px'
                  }}
                />
                
                <Title level={3} style={{ marginBottom: '16px', color: '#ffffff' }}>
                  AI動画生成中...
                </Title>
                
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#a0a0a0',
                  display: 'block',
                  lineHeight: '1.6'
                }}>
                  高品質な動画を作成しています<br />
                  完了まで約2-5分お待ちください
                </Text>
              </div>
            )}

            {/* 最新生成的视频 */}
            {currentVideo && currentVideo.status === 'completed' && currentVideo.videoUrl && (
              <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
                {/* 最新生成标识 */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(230, 0, 51, 0.4)'
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    background: '#ffffff', 
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  最新生成完了！
                </div>
                
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '24px',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid #e60033',
                  boxShadow: '0 0 20px rgba(230, 0, 51, 0.3)',
                  position: 'relative'
                }}>
                  {/* 发光效果 */}
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(45deg, #e60033, #ff6b7a, #e60033)',
                    borderRadius: '16px',
                    zIndex: -1,
                    filter: 'blur(4px)',
                    opacity: 0.6
                  }}></div>
                  
                  <video
                    src={currentVideo.videoUrl}
                    controls
                    style={{
                      width: '100%',
                      maxWidth: '720px',
                      borderRadius: '12px',
                      marginBottom: '16px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = currentVideo.videoUrl!;
                        link.download = `video-${currentVideo.id}.mp4`;
                        link.click();
                      }}
                    >
                      ダウンロード
                    </Button>
                    <Button
                      icon={<PlayCircleOutlined />}
                      onClick={() => setCurrentVideo(null)}
                    >
                      新しい動画を作成
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 历史记录列表 - 与最新视频相同的样式 */}
            {videoHistory.length > 0 && (
              <div>
                {/* 历史记录标题 */}
                {(currentVideo || isGenerating) && (
                  <div style={{
                    padding: '16px 0 12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    marginTop: '20px'
                  }}>
                    <Title level={4} style={{ 
                      color: '#ffffff', 
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      生成履歴 ({videoHistory.length})
                    </Title>
                  </div>
                )}
                
                {/* 历史记录 - 每个都像最新视频一样的完整预览 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {videoHistory.map(video => (
                    <div key={video.id} style={{ marginBottom: '20px' }}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative'
                      }}>
                        {/* 视频预览 */}
                        {video.videoUrl ? (
                          <video
                            src={video.videoUrl}
                            controls
                            style={{
                              width: '100%',
                              borderRadius: '12px',
                              marginBottom: '16px'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '200px',
                            background: `url(${video.thumbnailUrl}) center/cover`,
                            borderRadius: '12px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }} onClick={() => handlePlayHistoryVideo(video)}>
                            <PlayCircleOutlined style={{ 
                              fontSize: '48px', 
                              color: '#ffffff',
                              background: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: '50%',
                              padding: '12px'
                            }} />
                          </div>
                        )}
                        
                        {/* 视频信息 */}
                        <div style={{ marginBottom: '12px' }}>
                          <Text style={{
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {video.originalPrompt}
                          </Text>
                          <Text style={{
                            color: '#a0a0a0',
                            fontSize: '12px'
                          }}>
                            {new Date(video.createdAt).toLocaleDateString('ja-JP')} • 
                            {getRemainingDays(video.kieAiExpiresAt || video.localExpiresAt || '')}日残り
                          </Text>
                        </div>

                        {/* 操作按钮 */}
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                          <Button
                            icon={<PlayCircleOutlined />}
                            onClick={() => handlePlayHistoryVideo(video)}
                          >
                            再生
                          </Button>
                          {video.status === 'completed' && video.videoUrl && (
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={() => handleDownloadVideo(video)}
                            >
                              ダウンロード
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 空状态显示上传图片 */}
            {!isGenerating && !currentVideo && videoHistory.length === 0 && uploadedImages.length > 0 && (
              <div style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
                <Title level={3} style={{ marginBottom: '32px', color: '#ffffff' }}>
                  アップロード済み画像
                </Title>
                <Row gutter={[16, 16]} justify="center">
                  {uploadedImages.map((img) => (
                    <Col key={img.uid} xs={24} sm={12} md={8}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <Image
                          src={img.url}
                          alt={img.name}
                          style={{ 
                            width: '100%',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          preview={false}
                          onClick={() => handlePreviewImage(img.url)}
                        />
                        <Text style={{ 
                          fontSize: '12px', 
                          color: '#a0a0a0',
                          display: 'block',
                          marginTop: '8px',
                          textAlign: 'center'
                        }}>
                          {img.name}
                        </Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* 历史记录列表 - 完整预览样式 */}
            {videoHistory.length > 0 && (
              <div>
                {/* 历史记录标题 */}
                {(currentVideo || isGenerating) && (
                  <div style={{
                    padding: '16px 0 12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    marginTop: '20px'
                  }}>
                    <Title level={4} style={{ 
                      color: '#ffffff', 
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      生成履歴 ({videoHistory.length})
                    </Title>
                  </div>
                )}
                
                {/* 历史记录 - 使用新的完整预览样式 */}
                {isLoadingHistory ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: '16px', color: '#a0a0a0' }}>
                      履歴を読み込み中...
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    <React.Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#a0a0a0' }}>Loading history...</div>}>
                      {videoHistory.map(video => (
                        <VideoHistoryCard
                          key={video.id}
                          video={video}
                          user={user!}
                          onPlay={handlePlayHistoryVideo}
                          onDownload={handleDownloadVideo}
                          onUpgrade={handleUpgradeClick}
                        />
                      ))}
                    </React.Suspense>
                  </div>
                )}
              </div>
            )}

            {/* 空状态 */}
            {!isGenerating && !currentVideo && videoHistory.length === 0 && (
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
                  fontWeight: '300',
                  letterSpacing: '0.02em'
                }}>
                  AI動画生成の準備完了
                </Title>
                
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#a0a0a0',
                  lineHeight: '1.6',
                  display: 'block',
                  marginBottom: '32px'
                }}>
                  画像をアップロードし、プロンプトを入力して<br />
                  美しいAI動画を生成しましょう
                </Text>

                <div style={{
                  display: 'flex',
                  gap: '24px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginTop: '48px'
                }}>
                  {[
                    { icon: <PictureOutlined />, text: '高品質画像対応' },
                    { icon: <VideoCameraOutlined />, text: '4K動画生成' },
                    { icon: <ThunderboltOutlined />, text: '高速処理' }
                  ].map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: 'rgba(230, 0, 51, 0.1)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#e60033',
                        fontSize: '20px'
                      }}>
                        {feature.icon}
                      </div>
                      <Text style={{ 
                        fontSize: '12px', 
                        color: '#666666',
                        textAlign: 'center'
                      }}>
                        {feature.text}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Content>


      </Layout>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        title="画像プレビュー"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width="80%"
        style={{ maxWidth: '800px' }}
      >
        <Image
          alt="preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>

      {/* Premium升级模态框 */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <PremiumUpgradeModal
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgradeConfirm}
        />
      </React.Suspense>

      {/* 自定义样式 */}
      <style jsx global>{`
        .video-history-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .video-history-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .video-history-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .video-history-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Layout>
  );
}

export default function Playground() {
  return (
    <ErrorBoundary>
      <PlaygroundInner />
    </ErrorBoundary>
  );
} 