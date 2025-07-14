'use client';
import React, { useState } from 'react';
import { 
  Layout, Card, Button, Form, Input, message, Typography, Alert
} from 'antd';
import { 
  MailOutlined, ArrowLeftOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // 处理发送重置邮件
  const handleSendResetEmail = async (values: { email: string }) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedEmail(values.email);
        setEmailSent(true);
        message.success('リセット手順をメールで送信しました');
      } else {
        // 处理不同类型的错误
        let errorMessage = 'メール送信に失敗しました';
        
        if (result.error?.message) {
          if (result.error.message.includes('rate limit')) {
            errorMessage = 'リクエストが多すぎます。しばらく後にお試しください';
          } else if (result.error.message.includes('validation')) {
            errorMessage = 'メールアドレスをご確認ください';
          }
        }
        
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回登录页面
  const handleBackToLogin = () => {
    router.push('/auth/login');
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
          maxWidth: 480,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          {!emailSent ? (
            <>
              {/* 忘记密码表单 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
                  パスワードをお忘れですか？
                </Title>
                <Text type="secondary" style={{ color: '#a0a0a0' }}>
                  メールアドレスを入力して、パスワードリセット手順を受け取ってください
                </Text>
              </div>

              <Form
                form={form}
                onFinish={handleSendResetEmail}
                size="large"
                layout="vertical"
              >
                {/* 邮箱输入 */}
                <Form.Item
                  name="email"
                  label={<Text style={{ color: '#ffffff' }}>メールアドレス</Text>}
                  rules={[
                    { required: true, message: 'メールアドレスを入力してください' },
                    { type: 'email', message: '有効なメールアドレスを入力してください' }
                  ]}
                  style={{ marginBottom: '24px' }}
                >
                  <Input 
                    prefix={<MailOutlined style={{ color: '#a0a0a0' }} />} 
                    placeholder="登録時のメールアドレス"
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

                {/* 发送按钮 */}
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
                    {isLoading ? '送信中...' : 'リセット手順を送信'}
                  </Button>
                </Form.Item>

                {/* 返回登录链接 */}
                <div style={{ textAlign: 'center' }}>
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToLogin}
                    style={{ 
                      color: '#a0a0a0',
                      fontSize: '14px'
                    }}
                  >
                    ログインに戻る
                  </Button>
                </div>
              </Form>
            </>
          ) : (
            <>
              {/* 邮件发送成功页面 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginBottom: '24px' 
                }}>
                  <CheckCircleOutlined 
                    style={{ 
                      fontSize: '64px', 
                      color: '#52c41a' 
                    }} 
                  />
                </div>
                
                <Title level={2} style={{ color: '#ffffff', marginBottom: '16px' }}>
                  メールを送信しました
                </Title>
                
                <Text style={{ color: '#a0a0a0', fontSize: '16px', lineHeight: '1.6' }}>
                  <strong style={{ color: '#ffffff' }}>{submittedEmail}</strong> に<br />
                  パスワードリセット手順を送信しました。
                </Text>
              </div>

              <Alert
                message="重要なお知らせ"
                description={
                  <div style={{ color: '#a0a0a0' }}>
                    • メールが届かない場合は、迷惑メールフォルダをご確認ください<br />
                    • リセットリンクは1時間で有効期限が切れます<br />
                    • メールが届かない場合は、再度お試しください
                  </div>
                }
                type="info"
                showIcon
                style={{ 
                  marginBottom: '24px',
                  background: 'rgba(24, 144, 255, 0.1)',
                  border: '1px solid rgba(24, 144, 255, 0.3)'
                }}
              />

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  onClick={() => setEmailSent(false)}
                  style={{
                    flex: 1,
                    height: '48px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                >
                  再送信
                </Button>
                
                <Button
                  type="primary"
                  onClick={handleBackToLogin}
                  style={{
                    flex: 1,
                    height: '48px',
                    background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}
                >
                  ログインに戻る
                </Button>
              </div>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
} 