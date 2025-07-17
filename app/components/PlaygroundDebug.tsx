'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Layout, 
  Card, 
  Button, 
  Input, 
  Typography, 
  message,
  Spin,
  Form
} from 'antd';
import { 
  UserOutlined,
  LockOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { IUser } from '@/types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function PlaygroundDebug() {
  console.log('PlaygroundDebug component loading...');

  // 基本状态
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);
  const [loginForm] = Form.useForm();

  // 登录处理
  const handleLogin = useCallback(async (values: { email: string; password: string }) => {
    console.log('Login attempt:', values);
    try {
      // 模拟登录成功
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

  // 登出处理
  const handleLogout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    message.success('ログアウトしました');
  }, []);

  // 检查认证状态
  useEffect(() => {
    console.log('Checking auth status...');
    const checkAuth = async () => {
      try {
        // 确保在客户端环境中执行
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        // 简单的认证检查
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
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
            映像工房 - Debug
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
          映像工房 - Debug
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ color: '#ffffff' }}>
            {user?.email}
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 800,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: '#ffffff' }}>
              デバッグモード
            </Title>
            <Text style={{ color: '#a0a0a0', display: 'block', marginBottom: '24px' }}>
              認証が成功しました。ここで追加機能をテストできます。
            </Text>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <Text style={{ color: '#ffffff' }}>ユーザー情報:</Text>
              <pre style={{ color: '#a0a0a0', marginTop: '8px' }}>
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  );
} 