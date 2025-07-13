'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Layout, Card, Button, Typography, message, Input, Form } from 'antd';
import { UserOutlined, LockOutlined, LogoutOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { IUser, IVideo } from '@/types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SimplePlayground() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [videoHistory, setVideoHistory] = useState<IVideo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loginForm] = Form.useForm();

  // 获取视频历史记录
  const fetchVideoHistory = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 使用模拟数据
      const mockVideos: IVideo[] = [
        {
          id: 'demo-1',
          userId: user.id,
          originalPrompt: '桜の花が舞い散る美しい春の風景',
          translatedPrompt: 'A beautiful spring landscape where cherry blossom petals dance in the wind',
          taskId: 'demo-task-1',
          status: 'completed',
          videoUrl: 'https://example.com/video1.mp4',
          thumbnailUrl: 'https://via.placeholder.com/320x180?text=Cherry+Blossoms',
          creditsUsed: 1,
          kieAiExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          localExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          storageStatus: 'kie_ai_only',
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setVideoHistory(mockVideos);
      message.success(`模擬視頻履歴を表示しました (${mockVideos.length}件)`);
    } catch (error) {
      console.error('Error in fetchVideoHistory:', error);
      message.error('履歴の取得に失敗しました');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // 模拟视频生成
  const handleGenerateVideo = useCallback(async () => {
    if (!prompt.trim()) {
      message.warning('請輸入視頻描述');
      return;
    }

    setIsGenerating(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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

      setVideoHistory(prev => [mockVideo, ...prev]);
      setPrompt('');
      message.success('視頻生成完成！');
    } catch (error) {
      console.error('Generation error:', error);
      message.error('生成失敗');
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
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem('token', 'mock-token');
      setUser(mockUser);
      setIsAuthenticated(true);
      message.success('ログインに成功しました！');
      
      // 获取视频历史记录
      setTimeout(() => {
        fetchVideoHistory();
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      message.error('ログインに失敗しました');
    }
  }, [fetchVideoHistory]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setVideoHistory([]);
    message.success('ログアウトしました');
  }, []);

  // 检查认证状态
  useEffect(() => {
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
        updatedAt: new Date().toISOString()
      };

      setUser(mockUser);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // 加载状态
  if (isLoading) {
    return (
      <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', fontSize: '24px' }}>🎬</div>
          <Text style={{ color: '#666' }}>映像工房を読み込み中...</Text>
        </div>
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

  // 已认证状态
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
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
            {user?.email} ({user?.credits} credits)
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
      
      <Content style={{ 
        padding: '50px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            {/* 左侧：视频生成 */}
            <Card style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Title level={3} style={{ color: '#ffffff', marginBottom: '24px' }}>
                <VideoCameraOutlined style={{ marginRight: '8px' }} />
                視頻生成
              </Title>
              
              <div style={{ marginBottom: '24px' }}>
                <Text style={{ color: '#ffffff', display: 'block', marginBottom: '8px' }}>
                  動画の説明を入力してください：
                </Text>
                <TextArea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="生成したい動画の内容を日本語で詳しく説明してください..."
                  rows={4}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
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
            </Card>

            {/* 右侧：视频历史 */}
            <Card style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Title level={3} style={{ color: '#ffffff', marginBottom: '24px' }}>
                視頻履歴 ({videoHistory.length})
              </Title>
              
              {isLoadingHistory ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text style={{ color: '#a0a0a0' }}>履歴を読み込み中...</Text>
                </div>
              ) : videoHistory.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {videoHistory.map((video, index) => (
                    <div key={video.id} style={{
                      padding: '16px',
                      marginBottom: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: index === 0 ? '2px solid #e60033' : '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      {index === 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                          color: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          最新
                        </div>
                      )}
                      <Text style={{ color: '#ffffff', fontWeight: '500', display: 'block' }}>
                        {video.originalPrompt}
                      </Text>
                      <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
                        {new Date(video.createdAt).toLocaleDateString('ja-JP')} • 
                        ステータス: {video.status}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Text style={{ color: '#a0a0a0' }}>
                    まだ視頻がありません。<br />
                    左側のフォームから視頻を生成してください。
                  </Text>
                </div>
              )}
            </Card>
          </div>
        </div>
      </Content>
    </Layout>
  );
} 