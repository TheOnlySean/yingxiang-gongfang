'use client';
import React, { useState, useEffect } from 'react';
import { 
  Layout, Card, Button, Form, Input, message, Typography, Progress, Alert, Spin
} from 'antd';
import { 
  LockOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// 密码强度计算
const calculatePasswordStrength = (password: string): { strength: number; feedback: string[] } => {
  const feedback: string[] = [];
  let strength = 0;

  if (password.length >= 8) {
    strength += 20;
  } else {
    feedback.push('8文字以上にしてください');
  }

  if (/[a-z]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('小文字を含めてください');
  }

  if (/[A-Z]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('大文字を含めてください');
  }

  if (/[0-9]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('数字を含めてください');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    strength += 20;
  } else {
    feedback.push('特殊文字を含めてください');
  }

  return { strength, feedback };
};

// 获取强度颜色
const getStrengthColor = (strength: number): string => {
  if (strength < 40) return '#ff4d4f';
  if (strength < 60) return '#faad14';
  if (strength < 80) return '#1890ff';
  return '#52c41a';
};

// 获取强度文本
const getStrengthText = (strength: number): string => {
  if (strength < 40) return '弱い';
  if (strength < 60) return '普通';
  if (strength < 80) return '強い';
  return '非常に強い';
};

export default function ResetPasswordPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessful, setResetSuccessful] = useState(false);
  
  const token = searchParams.get('token');

  // 计算密码强度
  const { strength, feedback } = calculatePasswordStrength(password);
  
  // 检查密码匹配
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const showPasswordMismatch = confirmPassword && !passwordsMatch;

  // 验证重置令牌
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setTokenValidating(false);
        return;
      }

      try {
        // 这里我们通过尝试重设密码来验证令牌（使用一个无效密码来测试）
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            password: '',
            confirmPassword: ''
          }),
        });

        const result = await response.json();
        
        // 如果返回的是验证错误而不是token错误，说明token是有效的
        if (result.error?.code === 'VALIDATION_ERROR' && 
            result.error?.message?.includes('required')) {
          setTokenValid(true);
        } else if (result.error?.code === 'INVALID_TOKEN' || 
                   result.error?.code === 'TOKEN_EXPIRED') {
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setTokenValid(false);
      } finally {
        setTokenValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // 处理密码重设
  const handleResetPassword = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (strength < 60) {
      message.error('パスワードが強度不足です');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResetSuccessful(true);
        message.success('パスワードがリセットされました');
      } else {
        // 处理不同类型的错误
        let errorMessage = 'パスワードリセットに失敗しました';
        
        if (result.error?.message) {
          if (result.error.message.includes('token')) {
            errorMessage = 'リセットリンクが無効または期限切れです';
          } else if (result.error.message.includes('validation')) {
            errorMessage = 'パスワードをご確認ください';
          } else if (result.error.message.includes('rate limit')) {
            errorMessage = 'リクエストが多すぎます。しばらく後にお試しください';
          }
        }
        
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 返回登录页面
  const handleGoToLogin = () => {
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
          {tokenValidating ? (
            <>
              {/* Token验证中 */}
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Spin size="large" />
                <Text style={{ 
                  color: '#a0a0a0', 
                  display: 'block', 
                  marginTop: '16px' 
                }}>
                  リセットリンクを確認中...
                </Text>
              </div>
            </>
          ) : !tokenValid ? (
            <>
              {/* Token无效 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={2} style={{ color: '#ff4d4f', marginBottom: '16px' }}>
                  リンクが無効です
                </Title>
                <Text style={{ color: '#a0a0a0', fontSize: '16px', lineHeight: '1.6' }}>
                  このパスワードリセットリンクは無効または期限切れです。<br />
                  新しいリセットリンクをリクエストしてください。
                </Text>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  onClick={() => router.push('/auth/forgot-password')}
                  style={{
                    flex: 1,
                    height: '48px',
                    background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    color: '#ffffff'
                  }}
                >
                  新しいリンクを送信
                </Button>
                
                <Button
                  onClick={handleGoToLogin}
                  style={{
                    flex: 1,
                    height: '48px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '8px'
                  }}
                >
                  ログインに戻る
                </Button>
              </div>
            </>
          ) : resetSuccessful ? (
            <>
              {/* 重设成功 */}
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
                  パスワードをリセットしました
                </Title>
                
                <Text style={{ color: '#a0a0a0', fontSize: '16px', lineHeight: '1.6' }}>
                  新しいパスワードでログインできます。
                </Text>
              </div>

              <Button
                type="primary"
                onClick={handleGoToLogin}
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
                ログインページへ
              </Button>
            </>
          ) : (
            <>
              {/* 重设密码表单 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
                  新しいパスワード設定
                </Title>
                <Text type="secondary" style={{ color: '#a0a0a0' }}>
                  アカウントの新しいパスワードを設定してください
                </Text>
              </div>

              <Form
                form={form}
                onFinish={handleResetPassword}
                size="large"
                layout="vertical"
              >
                {/* 新密码输入 */}
                <Form.Item
                  name="password"
                  label={<Text style={{ color: '#ffffff' }}>新しいパスワード</Text>}
                  rules={[
                    { required: true, message: 'パスワードを入力してください' },
                    { min: 8, message: 'パスワードは8文字以上である必要があります' }
                  ]}
                  style={{ marginBottom: '16px' }}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
                    placeholder="新しいパスワードを入力"
                    onChange={(e) => setPassword(e.target.value)}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
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

                {/* 密码强度指示器 */}
                {password && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
                        パスワード強度
                      </Text>
                      <Text style={{ 
                        color: getStrengthColor(strength), 
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {getStrengthText(strength)}
                      </Text>
                    </div>
                    <Progress 
                      percent={strength} 
                      strokeColor={getStrengthColor(strength)}
                      trailColor="rgba(255, 255, 255, 0.1)"
                      showInfo={false}
                      size="small"
                    />
                    {feedback.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {feedback.map((item, index) => (
                          <Text 
                            key={index}
                            style={{ 
                              color: '#ff4d4f', 
                              fontSize: '11px',
                              display: 'block',
                              lineHeight: '1.4'
                            }}
                          >
                            • {item}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 确认密码 */}
                <Form.Item
                  name="confirmPassword"
                  label={<Text style={{ color: '#ffffff' }}>パスワード確認</Text>}
                  rules={[
                    { required: true, message: 'パスワードを再入力してください' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('パスワードが一致しません'));
                      },
                    }),
                  ]}
                  style={{ marginBottom: '20px' }}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
                    placeholder="パスワードを再入力"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: showPasswordMismatch ? '1px solid #ff4d4f' : '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      padding: '16px 20px',
                      fontSize: '15px',
                      height: '52px'
                    }}
                  />
                </Form.Item>

                {/* 密码匹配提示 */}
                {showPasswordMismatch && (
                  <Alert
                    message="パスワードが一致しません"
                    type="error"
                    showIcon
                    style={{ 
                      marginBottom: '20px',
                      background: 'rgba(255, 77, 79, 0.1)',
                      border: '1px solid rgba(255, 77, 79, 0.3)'
                    }}
                  />
                )}

                {/* 重设按钮 */}
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    disabled={strength < 60 || !passwordsMatch}
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
                    {isLoading ? 'パスワード変更中...' : 'パスワードをリセット'}
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
} 