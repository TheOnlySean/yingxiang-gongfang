'use client';

import React, { useState } from 'react';
import { Layout, Card, Button, Typography } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function MinimalTest() {
  const [count, setCount] = useState(0);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '18px',
          color: '#ffffff',
          letterSpacing: '0.05em'
        }}>
          映像工房 - Minimal Test
        </div>
      </Header>
      
      <Content style={{ 
        padding: '50px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 600,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: '#ffffff' }}>
              最小テスト
            </Title>
            <Text style={{ color: '#a0a0a0', display: 'block', marginBottom: '24px' }}>
              基本的なReactコンポーネントが動作するかテストします
            </Text>
            <div style={{ marginBottom: '24px' }}>
              <Text style={{ color: '#ffffff', fontSize: '24px' }}>
                カウント: {count}
              </Text>
            </div>
            <Button 
              type="primary"
              size="large"
              onClick={() => setCount(count + 1)}
              style={{
                background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                border: 'none',
                height: '48px',
                padding: '0 32px'
              }}
            >
              カウントアップ
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
} 