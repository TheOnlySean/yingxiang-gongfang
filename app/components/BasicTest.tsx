'use client';

import React, { useState } from 'react';
import { Layout, Card, Button, Typography, Input, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function BasicTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const handleLogin = (values: { email: string; password: string }) => {
    const mockUser = {
      id: '1',
      email: values.email,
      credits: 100
    };
    setUser(mockUser);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
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
            color: '#ffffff'
          }}>
            映像工房 - Basic Test
          </div>
        </Header>
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '50px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}>
          <Card style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2}>ログイン</Title>
              <Text type="secondary">映像工房にようこそ</Text>
            </div>
            <Form onFinish={handleLogin} size="large">
              <Form.Item
                name="email"
                rules={[{ required: true, message: 'メールアドレスを入力してください' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="メールアドレス" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'パスワードを入力してください' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="パスワード" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                  ログイン
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '18px',
          color: '#ffffff'
        }}>
          映像工房 - Basic Test
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text style={{ color: '#ffffff' }}>
            {user?.email} ({user?.credits} ポイント)
          </Text>
          <Button onClick={handleLogout} style={{ 
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff'
          }}>
            ログアウト
          </Button>
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
          maxWidth: 800,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2} style={{ color: '#ffffff' }}>
              認証成功！
            </Title>
            <Text style={{ color: '#a0a0a0', display: 'block', marginBottom: '24px' }}>
              基本的な認証フローが動作しています。
            </Text>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'left'
            }}>
              <Text style={{ color: '#ffffff' }}>ユーザー情報:</Text>
              <pre style={{ color: '#a0a0a0', marginTop: '8px' }}>
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  );
} 