'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function LineCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 获取URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage('LINE認証がキャンセルされました');
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('認証コードが見つかりません');
          return;
        }

        // 发送回调到后端
        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 保存token
            localStorage.setItem('token', result.data.token);
            
            setStatus('success');
            message.success('LINE認証に成功しました！');
            
            // 2秒后重定向到主页
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            setStatus('error');
            setErrorMessage(result.error?.message || 'LINE認証に失敗しました');
          }
        } else {
          setStatus('error');
          setErrorMessage('サーバーエラーが発生しました');
        }
      } catch (error) {
        console.error('Line callback error:', error);
        setStatus('error');
        setErrorMessage('認証処理中にエラーが発生しました');
      }
    };

    handleCallback();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '50px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 400,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          {status === 'loading' && (
            <>
              <Spin size="large" style={{ color: '#00B900' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                LINE認証を処理中...
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                しばらくお待ちください
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                認証成功！
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                映像工房へリダイレクトしています...
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <CloseCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                認証エラー
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                {errorMessage}
              </Text>
              <div style={{ marginTop: '24px' }}>
                <a 
                  href="/" 
                  style={{ 
                    color: '#1890ff',
                    textDecoration: 'underline'
                  }}
                >
                  ホームページに戻る
                </a>
              </div>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
} 