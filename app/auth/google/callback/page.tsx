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
      console.log('🔗 Google OAuth 回调处理开始');
      try {
        // 标记为已处理
        hasProcessed.current = true;

        // 获取授权码
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        console.log('📋 URL 参数:', {
          code: code ? `${code.substring(0, 10)}...` : 'null',
          state: state,
          error: error
        });

        if (error) {
          console.error('❌ Google OAuth 错误:', error);
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          console.error('❌ 没有找到授权码');
          throw new Error('Authorization code not found');
        }

        console.log('🔄 处理 Google OAuth 回调...');

        // 调用后端API处理Google OAuth回调
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, state })
        });

        console.log('📊 Google OAuth API 响应状态:', response.status);

        const result = await response.json();
        console.log('📝 Google OAuth API 响应:', {
          success: result.success,
          hasToken: !!result.data?.token,
          isNewUser: result.data?.isNewUser,
          error: result.error
        });

        if (!result.success) {
          // 特殊处理invalid_grant错误
          if (result.error?.message?.includes('invalid_grant')) {
            console.warn('⚠️ Invalid grant 错误，可能是开发环境中的代码重用');
            
            // 给用户更友好的提示，然后重试
            message.warning('认证码已使用，正在重新认证...', 2);
            
            // 清除URL参数并重新开始OAuth流程
            setTimeout(() => {
              console.log('🔄 重新跳转到登录页');
              router.push('/auth/login');
            }, 2000);
            return;
          }
          
          console.error('❌ Google OAuth 处理失败:', result.error);
          throw new Error(result.error?.message || 'Google OAuth processing failed');
        }

        // 存储JWT token
        if (result.data?.token) {
          console.log('💾 存储 JWT token');
          localStorage.setItem('token', result.data.token);
          message.success('Googleでログインしました');
          
          // 重定向到主页
          console.log('🏠 重定向到主页');
          router.push('/');
        } else {
          console.error('❌ 没有收到 token');
          throw new Error('No token received');
        }

      } catch (error) {
        console.error('💥 Google OAuth 回调异常:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        message.error('Google登录失败，请重试');
      } finally {
        setLoading(false);
        console.log('🏁 Google OAuth 回调处理完成');
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
