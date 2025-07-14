'use client';

import React, { useState } from 'react';
import { Layout, Card, Button, Form, Input, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 邮箱密码登录处理
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
          message.success('ログインに成功しました！');
          
          // 成功后跳转到主页
          setTimeout(() => {
            router.push('/');
          }, 1000);
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

  // Google OAuth登录处理
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
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
        </Link>
      </Header>
      
      <Content style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '50px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 460,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
              ログイン
            </Title>
            <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
              映像工房にようこそ
            </Text>
          </div>

          <Form
            form={form}
            onFinish={handleLogin}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="email"
              label={<Text style={{ color: '#ffffff' }}>メールアドレス</Text>}
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
              label={<Text style={{ color: '#ffffff' }}>パスワード</Text>}
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

            <Form.Item style={{ marginBottom: '24px' }}>
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
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0 16px',
                  color: '#a0a0a0',
                  fontSize: '12px'
                }}>
                  または
                </span>
              </div>
            </div>

            {/* Google OAuth登录按钮 */}
            <div style={{ marginBottom: '24px' }}>
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

            {/* 底部链接 */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text style={{ color: '#a0a0a0', marginRight: '8px' }}>
                アカウントをお持ちでない方は
              </Text>
              <Link 
                href="/auth/register"
                style={{ 
                  color: '#1890ff',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                新規登録
              </Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link 
                href="/auth/forgot-password"
                style={{ 
                  color: '#a0a0a0',
                  textDecoration: 'none',
                  fontSize: '12px'
                }}
              >
                パスワードをお忘れですか？
              </Link>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
} 