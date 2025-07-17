'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Upload, 
  Button, 
  Input, 
  Typography, 
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
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { IUploadedImage, IVideo, IUser } from '@/types';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Dragger } = Upload;

export default function PlaygroundFixed() {
  console.log('PlaygroundFixed component loading...');

  // ===== 基本状态 =====
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [loginForm] = Form.useForm();

  // ===== 视频生成状态 =====
  const [prompt, setPrompt] = useState('');
  const [uploadedImages, setUploadedImages] = useState<IUploadedImage[]>([]);
  const [_isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<IVideo | null>(null);

  // ===== 其他状态 =====
  const [previewVisible, setPreviewVisible] = useState(false);
  const [_previewImage, _setPreviewImage] = useState('');
  const [videoHistory, setVideoHistory] = useState<IVideo[]>([]);
  const [_showUpgradeModal, _setShowUpgradeModal] = useState(false);
  const [_currentTask, _setCurrentTask] = useState<string | null>(null);
  const [_userVideos, _setUserVideos] = useState<IVideo[]>([]);

  // ===== 工具函数 =====
  const getRemainingDays = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // ===== 事件处理器 =====
  const handleImageUpload = useCallback(async (file: File): Promise<boolean> => {
    setIsUploading(true);
    
    try {
      // 模拟上传
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newImage: IUploadedImage = {
        uid: file.name + Date.now(),
        name: file.name,
        url: URL.createObjectURL(file),
        file
      };
      
      setUploadedImages(prev => [...prev, newImage]);
              message.success(`${file.name} アップロード成功！`);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
      message.error('アップロードに失敗しました');
      return false;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleRemoveImage = useCallback((uid: string) => {
    setUploadedImages(prev => prev.filter(img => img.uid !== uid));
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      message.warning('動画の説明を入力してください');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentVideo(null);

    try {
      // 模拟视频生成
      for (let i = 0; i <= 100; i += 10) {
        setGenerationProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const mockVideo: IVideo = {
        id: 'mock-' + Date.now(),
        userId: user!.id,
        originalPrompt: prompt,
        translatedPrompt: prompt + ' (translated)',
        taskId: 'task-' + Date.now(),
        status: 'completed',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://via.placeholder.com/320x180',
        creditsUsed: 1,
        kieAiExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        localExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        storageStatus: 'kie_ai_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      setCurrentVideo(mockVideo);
      setVideoHistory(prev => [mockVideo, ...prev]);
              message.success('動画生成完了！');
    } catch (error) {
      console.error('Generation error:', error);
      message.error('生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, user]);

  const handleLogin = useCallback(async (values: { email: string; password: string }) => {
    try {
      // 模拟登录
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: IUser = {
        id: '1',
        email: values.email,
        credits: 100,
        totalUsed: 0,
        videosGenerated: 0,
        isActive: true,
        plan: 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
        authProvider: 'email'
      };

      setUser(mockUser);
      setIsAuthenticated(true);
      message.success('ログインに成功しました！');
    } catch (error) {
      console.error('Login error:', error);
      message.error('ログインに失敗しました');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setVideoHistory([]);
    setUploadedImages([]);
    setPrompt('');
    message.success('ログアウトしました');
  }, []);

  const handlePlayHistoryVideo = useCallback((video: IVideo) => {
    setCurrentVideo(video);
  }, []);

  const handleDownloadVideo = useCallback((video: IVideo) => {
    if (video.videoUrl) {
      message.success('ダウンロード開始');
    }
  }, []);

  // ===== 简化的认证检查 =====
  useEffect(() => {
    console.log('Starting auth check...');
    
    // 确保在客户端环境中执行
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    // 简化的同步认证检查
    const token = localStorage.getItem('token');
    if (token) {
              const mockUser: IUser = {
          id: '1',
          email: 'test@example.com',
          credits: 100,
          totalUsed: 0,
          videosGenerated: 0,
          isActive: true,
          plan: 'free',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          emailVerified: true,
          authProvider: 'email'
        };

      setUser(mockUser);
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
    console.log('Auth check completed');
  }, []);

  // ===== 渲染逻辑 =====
  
  // 加载状态
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Layout>
    );
  }

  // 未认证状态
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
          padding: '50px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
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
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  ログイン
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    );
  }

  // 已认证状态 - 主界面
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 头部导航 */}
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px'
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ color: '#ffffff' }}>
            {user?.email} ({user?.credits} ポイント)
          </Text>
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
        </div>
      </Header>

      {/* 主要内容区域 */}
      <Layout style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
        {/* 左侧设置面板 */}
        <Sider width={450} style={{ 
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '24px',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
              <SlidersOutlined style={{ marginRight: '8px' }} />
              設定
            </Title>
          </div>

          {/* 图片上传 */}
          <Card 
            title={
              <span style={{ color: '#ffffff' }}>
                <PictureOutlined style={{ marginRight: '8px' }} />
                画像アップロード (オプション)
              </span>
            }
            style={{ 
              marginBottom: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Dragger
              multiple
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false;
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px dashed rgba(255, 255, 255, 0.2)',
                borderRadius: '8px'
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#ffffff' }} />
              </p>
              <p style={{ color: '#ffffff' }}>
                ドラッグ&ドロップまたはクリックして画像をアップロード
              </p>
              <p style={{ color: '#a0a0a0' }}>
                対応形式：JPG、JPEG、PNG、GIF、WebP；各ファイル最大10MB
              </p>
            </Dragger>

            {/* 已上传的图片 */}
            {uploadedImages.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Row gutter={[8, 8]}>
                  {uploadedImages.map((image) => (
                    <Col span={8} key={image.uid}>
                      <div style={{ position: 'relative' }}>
                        <Image
                          src={image.url}
                          alt={image.name}
                          style={{ 
                            width: '100%', 
                            height: '80px', 
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                          preview={{
                            mask: <EyeOutlined />
                          }}
                        />
                        <Button
                          type="text"
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => handleRemoveImage(image.uid)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0, 0, 0, 0.6)',
                            color: '#ffffff',
                            border: 'none'
                          }}
                        />
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
              <span style={{ color: '#ffffff' }}>
                <VideoCameraOutlined style={{ marginRight: '8px' }} />
                動画の説明
              </span>
            }
            style={{ 
              marginBottom: '24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
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
                borderRadius: '8px'
              }}
            />
            <div style={{ marginTop: '16px' }}>
              <Button
                type="primary"
                size="large"
                loading={isGenerating}
                onClick={handleGenerateVideo}
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
                {isGenerating ? '生成中...' : '動画を生成'}
              </Button>
            </div>
          </Card>
        </Sider>

        {/* 右侧预览区域 */}
        <Content style={{ padding: '24px' }}>
          <div style={{ 
            height: 'calc(100vh - 112px)',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            {/* 生成进度 */}
            {isGenerating && (
              <Card style={{
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
                    動画生成中...
                  </Title>
                  <Progress
                    type="circle"
                    percent={generationProgress}
                    size={120}
                    strokeColor={{
                      '0%': '#e60033',
                      '100%': '#ff6b7a',
                    }}
                    format={(percent) => (
                      <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>
                        {percent}%
                      </span>
                    )}
                  />
                </div>
              </Card>
            )}

            {/* 当前视频显示 */}
            {currentVideo && (
              <Card style={{
                marginBottom: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid #e60033',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
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
                  最新生成完了!
                </div>
                
                {/* 视频预览 */}
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: `url(${currentVideo.thumbnailUrl}) center/cover`,
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PlayCircleOutlined style={{ 
                      fontSize: '64px', 
                      color: '#ffffff'
                    }} />
                  </div>
                </div>
                
                {/* 视频信息 */}
                <div style={{ marginBottom: '16px' }}>
                  <Text style={{
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '500',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    {currentVideo.originalPrompt}
                  </Text>
                  <Text style={{
                    color: '#a0a0a0',
                    fontSize: '14px'
                  }}>
                    {new Date(currentVideo.createdAt).toLocaleDateString('ja-JP')} • 
                    {getRemainingDays(currentVideo.kieAiExpiresAt || '')}日残り
                  </Text>
                </div>

                {/* 操作按钮 */}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  justifyContent: 'center'
                }}>
                  <Button
                    icon={<PlayCircleOutlined />}
                    onClick={() => handlePlayHistoryVideo(currentVideo)}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff'
                    }}
                  >
                    再生
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadVideo(currentVideo)}
                  >
                    ダウンロード
                  </Button>
                </div>
              </Card>
            )}

            {/* 历史记录 */}
            {videoHistory.length > 0 && (currentVideo || isGenerating) && (
              <div>
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {videoHistory.slice(1).map(video => (
                    <Card key={video.id} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px'
                    }}>
                      {/* 简化的历史记录项 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '120px',
                          height: '68px',
                          background: `url(${video.thumbnailUrl}) center/cover`,
                          borderRadius: '8px',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <Text style={{ color: '#ffffff', fontWeight: '500' }}>
                            {video.originalPrompt}
                          </Text>
                          <div style={{ marginTop: '4px' }}>
                            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
                              {new Date(video.createdAt).toLocaleDateString('ja-JP')}
                            </Text>
                          </div>
                        </div>
                        <Button
                          icon={<PlayCircleOutlined />}
                          onClick={() => handlePlayHistoryVideo(video)}
                          style={{ 
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#ffffff'
                          }}
                        >
                          再生
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
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
                  fontWeight: '300'
                }}>
                  動画を生成しましょう
                </Title>
                
                <Text style={{ 
                  color: '#a0a0a0',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}>
                  左側のパネルから画像をアップロードし、<br />
                  動画の説明を入力して生成を開始してください。
                </Text>
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
          src={_previewImage}
        />
      </Modal>
    </Layout>
  );
} 