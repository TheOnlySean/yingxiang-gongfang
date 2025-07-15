'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Space, Button, Alert } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function DebugOAuthPage() {
  const [config, setConfig] = useState<any>({});
  const [authUrl, setAuthUrl] = useState<string>('');

  useEffect(() => {
    // 显示当前配置
    setConfig({
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      environment: process.env.NODE_ENV || 'Not set',
      timestamp: new Date().toISOString()
    });
  }, []);

  const testOAuthUrl = async () => {
    try {
      const response = await fetch('/api/auth/google');
      const result = await response.json();
      
      if (result.success) {
        setAuthUrl(result.data.authUrl);
      } else {
        console.error('OAuth URL generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Google OAuth 调试信息</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="当前配置">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>应用URL: </Text>
              <Text code>{config.appUrl}</Text>
            </div>
            <div>
              <Text strong>环境: </Text>
              <Text code>{config.environment}</Text>
            </div>
            <div>
              <Text strong>时间戳: </Text>
              <Text code>{config.timestamp}</Text>
            </div>
          </Space>
        </Card>

        <Card title="OAuth配置检查">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              <Text strong>预期的重定向URI应该是：</Text>
            </Paragraph>
            <div style={{ background: '#f6f6f6', padding: '12px', borderRadius: '4px' }}>
              <Text code>{config.appUrl}/auth/google/callback</Text>
            </div>
            
            <Button type="primary" onClick={testOAuthUrl}>
              生成OAuth URL
            </Button>
            
            {authUrl && (
              <div>
                <Text strong>生成的OAuth URL:</Text>
                <div style={{ background: '#f6f6f6', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                  <Text code style={{ wordBreak: 'break-all' }}>{authUrl}</Text>
                </div>
              </div>
            )}
          </Space>
        </Card>

        <Card title="Google Cloud Console 检查项">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="请确认以下配置"
              description={
                <ul>
                  <li>OAuth 2.0客户端ID的授权重定向URI包含: <code>{config.appUrl}/auth/google/callback</code></li>
                  <li>授权JavaScript来源包含: <code>{config.appUrl}</code></li>
                  <li>OAuth同意屏幕中已授权域名包含: <code>eizokobo.vercel.app</code></li>
                  <li>应用状态是"Published"或您的邮箱在测试用户列表中</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Space>
        </Card>

        <Card title="网络信息">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>User Agent: </Text>
              <Text code>{typeof window !== 'undefined' ? window.navigator.userAgent : 'Loading...'}</Text>
            </div>
            <div>
              <Text strong>Location: </Text>
              <Text code>{typeof window !== 'undefined' ? window.location.href : 'Loading...'}</Text>
            </div>
          </Space>
        </Card>
      </Space>
    </div>
  );
} 