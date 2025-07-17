'use client';

import React, { useState } from 'react';
import { 
  Card, Button, Form, Input, message, Typography, Divider, 
  Checkbox, Progress, Alert
} from 'antd';
import { 
  UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, 
  EyeTwoTone, ArrowLeftOutlined, CheckCircleOutlined, GoogleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-sent';

interface MobileAuthSystemProps {
  onAuthSuccess?: (user: any) => void;
}

export default function MobileAuthSystem({ onAuthSuccess }: MobileAuthSystemProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // 注册相关状态
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // 密码强度计算
  const calculatePasswordStrength = (password: string): { strength: number; feedback: string[] } => {
    const feedback: string[] = [];
    let strength = 0;

    if (password.length >= 8) {
      strength += 20;
    } else {
      feedback.push('8文字以上');
    }

    if (/[a-z]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('小文字');
    }

    if (/[A-Z]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('大文字');
    }

    if (/[0-9]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('数字');
    }

    if (/[^a-zA-Z0-9]/.test(password)) {
      strength += 20;
    } else {
      feedback.push('特殊文字');
    }

    return { strength, feedback };
  };

  const { strength, feedback } = calculatePasswordStrength(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const showPasswordMismatch = confirmPassword && !passwordsMatch;

  // 处理登录
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
          
          if (onAuthSuccess) {
            onAuthSuccess(result.data.user);
          } else {
            router.push('/');
          }
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

  // 处理注册
  const handleRegister = async (values: { email: string; password: string; confirmPassword: string }) => {
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
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        message.success('アカウントが作成されました！');
        
        if (result.data && result.data.token) {
          localStorage.setItem('token', result.data.token);
          
          if (onAuthSuccess) {
            onAuthSuccess(result.data.user);
          } else {
            router.push('/');
          }
        }
      } else {
        let errorMessage = '登録に失敗しました';
        if (result.error?.message) {
          if (result.error.message.includes('already exists')) {
            errorMessage = 'このメールアドレスは既に使用されています';
          } else if (result.error.message.includes('validation')) {
            errorMessage = '入力内容をご確認ください';
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

  // 处理忘记密码
  const handleForgotPassword = async (values: { email: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        setSubmittedEmail(values.email);
        setAuthMode('reset-sent');
        message.success('リセット手順をメールで送信しました');
      } else {
        let errorMessage = 'メール送信に失敗しました';
        if (result.error?.message) {
          if (result.error.message.includes('rate limit')) {
            errorMessage = 'リクエストが多すぎます。しばらく後にお試しください';
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

  // 处理Google登录
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google', {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
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

  // 渲染登录表单
  const renderLoginForm = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ color: '#ffffff', marginBottom: '8px' }}>
          ログイン
        </Title>
        <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
          映像工房にようこそ
        </Text>
      </div>

      <Form form={form} onFinish={handleLogin} layout="vertical">
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
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
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
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: '16px' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
            style={{
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              border: 'none',
              borderRadius: '8px',
              minHeight: '44px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </Form.Item>

        <Divider style={{ margin: '16px 0', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>または</Text>
        </Divider>

        <Button
          type="default"
          onClick={handleGoogleLogin}
          loading={isLoading}
          block
          size="large"
          icon={<GoogleOutlined />}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            borderRadius: '8px',
            minHeight: '44px',
            marginBottom: '16px'
          }}
        >
          Googleでログイン
        </Button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
            アカウントをお持ちでない方は{' '}
            <Button 
              type="link" 
              size="small" 
              style={{ color: '#1890ff', padding: 0 }}
              onClick={() => setAuthMode('register')}
            >
              新規登録
            </Button>
          </Text>
        </div>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Button 
            type="link" 
            size="small"
            style={{ color: '#a0a0a0', padding: 0, fontSize: '12px' }}
            onClick={() => setAuthMode('forgot-password')}
          >
            パスワードをお忘れですか？
          </Button>
        </div>
      </Form>
    </div>
  );

  // 渲染注册表单
  const renderRegisterForm = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ color: '#ffffff', marginBottom: '8px' }}>
          アカウント作成
        </Title>
        <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
          映像工房へようこそ
        </Text>
      </div>

      <Form form={form} onFinish={handleRegister} layout="vertical">
        <Form.Item
          name="email"
          label={<Text style={{ color: '#ffffff' }}>メールアドレス</Text>}
          rules={[
            { required: true, message: 'メールアドレスを入力してください' },
            { type: 'email', message: '有効なメールアドレスを入力してください' }
          ]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: '#a0a0a0' }} />} 
            placeholder="example@email.com"
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<Text style={{ color: '#ffffff' }}>パスワード</Text>}
          rules={[
            { required: true, message: 'パスワードを入力してください' },
            { min: 8, message: 'パスワードは8文字以上である必要があります' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
            placeholder="安全なパスワードを入力"
            size="large"
            onChange={(e) => setPassword(e.target.value)}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
            }}
          />
        </Form.Item>

        {/* 密码强度指示器 */}
        {password && (
          <div style={{ marginBottom: '16px' }}>
            <Progress
              percent={strength}
              size="small"
              strokeColor={{
                '0%': strength < 40 ? '#ff4d4f' : strength < 80 ? '#faad14' : '#52c41a',
                '100%': strength < 40 ? '#ff4d4f' : strength < 80 ? '#faad14' : '#52c41a'
              }}
              showInfo={false}
              style={{ marginBottom: '8px' }}
            />
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              {strength < 40 ? '弱い' : strength < 80 ? '普通' : '強い'}
              {feedback.length > 0 && (
                <span style={{ marginLeft: '8px' }}>
                  必要: {feedback.join(', ')}
                </span>
              )}
            </Text>
          </div>
        )}

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
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#a0a0a0' }} />}
            placeholder="パスワードを再入力"
            size="large"
            onChange={(e) => setConfirmPassword(e.target.value)}
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: showPasswordMismatch ? '1px solid #ff4d4f' : '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
            }}
          />
        </Form.Item>

        {showPasswordMismatch && (
          <Alert
            message="パスワードが一致しません"
            type="error"
            showIcon
            style={{ 
              marginBottom: '16px',
              background: 'rgba(255, 77, 79, 0.1)',
              border: '1px solid rgba(255, 77, 79, 0.3)'
            }}
          />
        )}

        <Form.Item style={{ marginBottom: '16px' }}>
          <Checkbox
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            style={{ color: '#ffffff' }}
          >
            <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
              利用規約およびプライバシーポリシーに同意します
            </Text>
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            disabled={!agreedToTerms || strength < 60 || !passwordsMatch}
            block
            size="large"
            style={{
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              border: 'none',
              borderRadius: '8px',
              minHeight: '44px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'アカウント作成中...' : 'アカウントを作成'}
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text style={{ color: '#a0a0a0', fontSize: '12px' }}>
            既にアカウントをお持ちですか？{' '}
            <Button 
              type="link" 
              size="small" 
              style={{ color: '#1890ff', padding: 0 }}
              onClick={() => setAuthMode('login')}
            >
              ログイン
            </Button>
          </Text>
        </div>
      </Form>
    </div>
  );

  // 渲染忘记密码表单
  const renderForgotPasswordForm = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => setAuthMode('login')}
          style={{ 
            color: '#a0a0a0', 
            position: 'absolute', 
            left: '0', 
            top: '0',
            minWidth: '44px',
            minHeight: '44px'
          }}
        />
        <Title level={3} style={{ color: '#ffffff', marginBottom: '8px' }}>
          パスワードリセット
        </Title>
        <Text style={{ color: '#a0a0a0', fontSize: '14px' }}>
          メールアドレスを入力してください
        </Text>
      </div>

      <Form form={form} onFinish={handleForgotPassword} layout="vertical">
        <Form.Item
          name="email"
          label={<Text style={{ color: '#ffffff' }}>メールアドレス</Text>}
          rules={[
            { required: true, message: 'メールアドレスを入力してください' },
            { type: 'email', message: '有効なメールアドレスを入力してください' }
          ]}
        >
          <Input 
            prefix={<MailOutlined style={{ color: '#a0a0a0' }} />} 
            placeholder="登録時のメールアドレス"
            size="large"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              borderRadius: '8px',
              minHeight: '44px'
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            block
            size="large"
            style={{
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              border: 'none',
              borderRadius: '8px',
              minHeight: '44px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '送信中...' : 'リセット手順を送信'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  // 渲染重置邮件发送成功页面
  const renderResetSentForm = () => (
    <div style={{ textAlign: 'center' }}>
      <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
      <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
        メール送信完了
      </Title>
      <Text style={{ color: '#a0a0a0', fontSize: '14px', display: 'block', marginBottom: '24px' }}>
        {submittedEmail} にパスワードリセットの手順を送信しました。
      </Text>
      <Text style={{ color: '#a0a0a0', fontSize: '12px', display: 'block', marginBottom: '24px' }}>
        メールが届かない場合は、迷惑メールフォルダをご確認ください。
      </Text>
      <Button
        type="primary"
        onClick={() => setAuthMode('login')}
        block
        size="large"
        style={{
          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
          border: 'none',
          borderRadius: '8px',
          minHeight: '44px',
          fontWeight: 'bold'
        }}
      >
        ログインに戻る
      </Button>
    </div>
  );

  return (
    <Card style={{ 
      margin: '20px', 
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      position: 'relative'
    }}>
      {authMode === 'login' && renderLoginForm()}
      {authMode === 'register' && renderRegisterForm()}
      {authMode === 'forgot-password' && renderForgotPasswordForm()}
      {authMode === 'reset-sent' && renderResetSentForm()}
    </Card>
  );
} 