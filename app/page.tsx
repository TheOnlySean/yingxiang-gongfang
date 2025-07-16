'use client'

import { Layout, Typography, Button } from 'antd';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function Home() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' }}>
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
          映像工房
        </div>
      </Header>
      
      <Content style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={1} style={{ color: '#ffffff', marginBottom: '20px' }}>
            映像工房
          </Title>
          <Text style={{ color: '#ffffff', fontSize: '18px', display: 'block', marginBottom: '30px' }}>
            想像を動画に変える魔法 - AI動画生成ツール
          </Text>
          <Button 
            type="primary" 
            size="large"
            style={{
              background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
            onClick={() => window.location.href = '/auth/login'}
          >
            ログインして始める
          </Button>
        </div>
      </Content>
    </Layout>
  );
} 