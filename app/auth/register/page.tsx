'use client';
import React, { useState } from 'react';
import { 
  Layout, Card, Button, Form, Input, Checkbox, message, Typography,
  Progress, Alert
} from 'antd';
import { 
  LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
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

export default function RegisterPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // 计算密码强度
  const { strength, feedback } = calculatePasswordStrength(password);
  
  // 检查密码匹配
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const showPasswordMismatch = confirmPassword && !passwordsMatch;

  // 处理注册
  const handleRegister = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (!agreedToTerms) {
      message.error('利用規約に同意してください');
      return;
    }

    if (strength < 60) {
      message.error('パスワードが強度不足です');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success('アカウントが作成されました！ログイン中...');
        
        // 保存token到localStorage
        if (result.data && result.data.token) {
          localStorage.setItem('token', result.data.token);
        }
        
        // 注册成功后直接跳转到主页（已登录状态）
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        // 处理不同类型的错误
        let errorMessage = '登録に失敗しました';
        
        if (result.error?.message) {
          if (result.error.message.includes('already exists')) {
            errorMessage = 'このメールアドレスは既に使用されています';
          } else if (result.error.message.includes('validation')) {
            errorMessage = '入力内容をご確認ください';
          } else if (result.error.message.includes('rate limit')) {
            errorMessage = '登録試行回数が多すぎます。しばらく後にお試しください';
          }
        }
        
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      message.error('登録エラーが発生しました');
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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
              アカウント作成
            </Title>
            <Text type="secondary" style={{ color: '#a0a0a0' }}>
              映像工房へようこそ
            </Text>
          </div>

          <Form
            form={form}
            onFinish={handleRegister}
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
              style={{ marginBottom: '20px' }}
            >
              <Input 
                prefix={<MailOutlined style={{ color: '#a0a0a0' }} />} 
                placeholder="example@email.com"
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

            {/* 密码输入 */}
            <Form.Item
              name="password"
              label={<Text style={{ color: '#ffffff' }}>パスワード</Text>}
              rules={[
                { required: true, message: 'パスワードを入力してください' },
                { min: 8, message: 'パスワードは8文字以上である必要があります' }
              ]}
              style={{ marginBottom: '16px' }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
                placeholder="安全なパスワードを入力"
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

            {/* 条款同意 */}
            <Form.Item style={{ marginBottom: '24px' }}>
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ color: '#ffffff' }}
              >
                <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
                  <Link href="/terms" style={{ color: '#1890ff' }}>利用規約</Link>
                  および
                  <Link href="/privacy" style={{ color: '#1890ff' }}>プライバシーポリシー</Link>
                  に同意します
                </Text>
              </Checkbox>
            </Form.Item>

            {/* 注册按钮 */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={!agreedToTerms || strength < 60 || !passwordsMatch}
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
                {isLoading ? 'アカウント作成中...' : 'アカウントを作成'}
              </Button>
            </Form.Item>

            {/* 登录链接 */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Text style={{ color: '#a0a0a0' }}>
                既にアカウントをお持ちですか？{' '}
                <Link 
                  href="/auth/login"
                  style={{ 
                    color: '#1890ff',
                    textDecoration: 'none'
                  }}
                >
                  ログイン
                </Link>
              </Text>
            </div>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
} 