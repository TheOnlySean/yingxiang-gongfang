'use client';

import { useState } from 'react';
import { Card, Button, Typography, Alert, Space } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function OAuthTestPage() {
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const generateAuthUrl = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/google');
      const result = await response.json();
      
      if (result.success) {
        setAuthUrl(result.data.authUrl);
      } else {
        setError(result.error?.message || 'Failed to generate auth URL');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const parseAuthUrl = (url: string) => {
    if (!url) return null;
    
    const urlObj = new URL(url);
    return {
      baseUrl: urlObj.origin + urlObj.pathname,
      clientId: urlObj.searchParams.get('client_id'),
      redirectUri: urlObj.searchParams.get('redirect_uri'),
      scope: urlObj.searchParams.get('scope'),
      responseType: urlObj.searchParams.get('response_type'),
      state: urlObj.searchParams.get('state')
    };
  };

  const urlInfo = parseAuthUrl(authUrl);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2}>Google OAuth 详细测试</Title>
      
      <Alert
        message="当前错误：invalid_request"
        description="这个错误通常意味着应用处于测试状态或配置不正确。"
        type="error"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="步骤1: 生成OAuth URL">
          <Button 
            type="primary" 
            onClick={generateAuthUrl}
            loading={loading}
            size="large"
          >
            生成OAuth URL
          </Button>
          
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              style={{ marginTop: '10px' }}
            />
          )}
        </Card>

        {authUrl && (
          <Card title="步骤2: OAuth URL 详细信息">
            <div style={{ marginBottom: '15px' }}>
              <Text strong>完整URL：</Text>
              <div style={{ 
                background: '#f6f6f6', 
                padding: '10px', 
                borderRadius: '4px', 
                marginTop: '5px',
                wordBreak: 'break-all'
              }}>
                <Text code>{authUrl}</Text>
              </div>
            </div>

            {urlInfo && (
              <div>
                <Text strong>URL 参数解析：</Text>
                <ul style={{ marginTop: '10px' }}>
                  <li><Text strong>Client ID:</Text> <Text code>{urlInfo.clientId}</Text></li>
                  <li><Text strong>Redirect URI:</Text> <Text code>{urlInfo.redirectUri}</Text></li>
                  <li><Text strong>Scope:</Text> <Text code>{urlInfo.scope}</Text></li>
                  <li><Text strong>Response Type:</Text> <Text code>{urlInfo.responseType}</Text></li>
                  <li><Text strong>State:</Text> <Text code>{urlInfo.state}</Text></li>
                </ul>
              </div>
            )}
          </Card>
        )}

        <Card title="步骤3: 测试OAuth">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              <Text strong>在隐身模式下测试：</Text>
            </Paragraph>
            
            {authUrl && (
              <Button
                type="default"
                onClick={() => window.open(authUrl, '_blank')}
                size="large"
              >
                在新标签页中打开OAuth URL
              </Button>
            )}
            
            <Paragraph style={{ marginTop: '15px' }}>
              <Text strong>或者直接测试完整流程：</Text>
            </Paragraph>
            
            <Button
              type="primary"
              onClick={() => window.open('https://eizokobo.vercel.app/auth/login', '_blank')}
              size="large"
            >
              在新标签页中打开登录页面
            </Button>
          </Space>
        </Card>

        <Card title="步骤4: Google Console 配置检查">
          <Alert
            message="请确认以下配置"
            description={
              <div>
                <p><strong>在Google Cloud Console中检查：</strong></p>
                <ol>
                  <li>应用状态是否为 "Published" 或 "In production"</li>
                  <li>Authorized domains 包含: <code>eizokobo.vercel.app</code></li>
                  <li>OAuth客户端的重定向URI包含: <code>https://eizokobo.vercel.app/auth/google/callback</code></li>
                  <li>JavaScript来源包含: <code>https://eizokobo.vercel.app</code></li>
                </ol>
              </div>
            }
            type="info"
            showIcon
          />
        </Card>

        <Card title="步骤5: 故障排除">
          <div>
            <Text strong>如果仍然出现 invalid_request 错误：</Text>
            <ol style={{ marginTop: '10px' }}>
              <li>使用浏览器隐身模式测试</li>
              <li>清除所有 Google 相关的 cookies</li>
              <li>等待10-15分钟让Google配置生效</li>
              <li>检查是否有拼写错误或配置不匹配</li>
            </ol>
          </div>
        </Card>
      </Space>
    </div>
  );
} 