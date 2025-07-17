'use client';

import { useState } from 'react';
import { Button, Card, Typography, Space, Divider, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function TestOAuthPage() {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const testGetGoogleAuthUrl = async () => {
    try {
      setLoading(true);
      message.info('Google認証URLを取得中...');

      const response = await fetch('/api/auth/google', {
        method: 'GET'
      });

      const result = await response.json();
      console.log('Google Auth URL Response:', result);

      if (result.success && result.data?.authUrl) {
        setAuthUrl(result.data.authUrl);
        message.success('Google認証URL取得成功！');
      } else {
                  message.error('Google認証URL取得に失敗しました: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Get Google Auth URL error:', error);
              message.error('リクエストに失敗しました: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const redirectToGoogle = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      message.warning('まず認証URLを取得してください');
    }
  };

  const testGoogleOAuthCallback = async () => {
    try {
      const testCode = 'test_authorization_code';
      message.info('Google OAuthコールバックをテスト中...');

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: testCode })
      });

      const result = await response.json();
      console.log('Google OAuth Callback Response:', result);

      if (result.success) {
        message.success('Google OAuthコールバックテスト成功！');
      } else {
                  message.error('Google OAuthコールバックテストに失敗しました: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Google OAuth callback test error:', error);
              message.error('コールバックテストに失敗しました: ' + (error as Error).message);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      minHeight: '100vh'
    }}>
      <Card style={{ background: '#f0f0f0' }}>
        <Title level={2} style={{ textAlign: 'center', color: '#1890ff' }}>
          Google OAuth 测试页面
        </Title>
        
        <Divider />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card type="inner" title="步骤 1: 获取Google授权URL">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                点击下面的按钮测试Google OAuth授权URL生成功能：
              </Paragraph>
              
              <Button 
                type="primary" 
                icon={<GoogleOutlined />}
                loading={loading}
                onClick={testGetGoogleAuthUrl}
                size="large"
              >
                获取Google授权URL
              </Button>

              {authUrl && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong>授权URL生成成功：</Text>
                  <div style={{ 
                    background: '#f6f6f6', 
                    padding: '12px', 
                    borderRadius: '6px', 
                    marginTop: '8px',
                    wordBreak: 'break-all'
                  }}>
                    <Text code>{authUrl}</Text>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          <Card type="inner" title="步骤 2: 跳转到Google授权页面">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                如果授权URL生成成功，点击下面的按钮跳转到Google授权页面：
              </Paragraph>
              
              <Button 
                type="default"
                icon={<GoogleOutlined />}
                onClick={redirectToGoogle}
                disabled={!authUrl}
                size="large"
              >
                跳转到Google授权页面
              </Button>

              <Text type="secondary">
                注意：这将重定向到真实的Google授权页面
              </Text>
            </Space>
          </Card>

          <Card type="inner" title="步骤 3: 测试回调处理（模拟）">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                模拟测试Google OAuth回调处理逻辑：
              </Paragraph>
              
              <Button 
                type="dashed"
                onClick={testGoogleOAuthCallback}
                size="large"
              >
                模拟测试回调处理
              </Button>

              <Text type="secondary">
                注意：这只是测试API端点，不会进行真实的Google验证
              </Text>
            </Space>
          </Card>

          <Card type="inner" title="调试信息">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>环境配置：</Text>
              <ul>
                <li>App URL: <Text code>http://localhost:3003</Text></li>
                <li>回调URL: <Text code>http://localhost:3003/auth/google/callback</Text></li>
                <li>Google Client ID: <Text code>已配置 ✓</Text></li>
                <li>Google Client Secret: <Text code>已配置 ✓</Text></li>
              </ul>
              
              <Text type="secondary">
                打开浏览器开发者工具查看详细的请求和响应日志
              </Text>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
} 