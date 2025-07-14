'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spin, Result, message } from 'antd';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false); // 防止重复处理

  useEffect(() => {
    // 防止React严格模式下的重复执行
    if (hasProcessed.current) {
      return;
    }

    const handleGoogleCallback = async () => {
      try {
        // 标记为已处理
        hasProcessed.current = true;

        // 获取授权码
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Authorization code not found');
        }

        console.log('Processing Google OAuth callback with code:', code.substring(0, 10) + '...');

        // 调用后端API处理Google OAuth回调
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, state })
        });

        const result = await response.json();

        if (!result.success) {
          // 特殊处理invalid_grant错误
          if (result.error?.message?.includes('invalid_grant')) {
            console.warn('Invalid grant detected, this may be due to code reuse in development');
            
            // 给用户更友好的提示，然后重试
            message.warning('认证码已使用，正在重新认证...', 2);
            
            // 清除URL参数并重新开始OAuth流程
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
            return;
          }
          
          throw new Error(result.error?.message || 'Google OAuth processing failed');
        }

        // 存储JWT token
        if (result.data?.token) {
          localStorage.setItem('token', result.data.token);
          message.success(result.data.isNewUser ? 'Google注册成功！' : 'Google登录成功！');
          
          // 重定向到主页
          router.push('/');
        } else {
          throw new Error('No token received');
        }

      } catch (error) {
        console.error('Google OAuth callback error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        message.error('Google登录失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, fontSize: 16 }}>
            Google認証処理中...
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            少々お待ちください
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Result
          status="error"
          title="Google登録失敗"
          subTitle={error}
          extra={[
            <button 
              key="retry" 
              onClick={() => router.push('/auth/login')}
              style={{
                background: '#1890ff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ログインに戻る
            </button>
          ]}
        />
      </div>
    );
  }

  return null;
}
