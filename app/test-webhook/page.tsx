'use client';

import { useState } from 'react';
import { Card, Button, Typography, Alert } from 'antd';

const { Title, Text } = Typography;

export default function TestWebhookPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/stripe/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature'
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              customer_email: 'test@example.com',
              payment_status: 'paid',
              metadata: {
                user_id: 'test-user-123',
                credits: '1000'
              }
            }
          }
        })
      });

      const data = await response.text();
      setResult(`Status: ${response.status}\nResponse: ${data}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Webhook 测试页面</Title>
      
      <Card>
        <p>点击下面的按钮测试 Stripe webhook 端点：</p>
        
        <Button 
          type="primary" 
          onClick={testWebhook}
          loading={loading}
          style={{ marginBottom: '20px' }}
        >
          测试 Webhook
        </Button>
        
        {result && (
          <Alert
            message="测试结果"
            description={
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {result}
              </pre>
            }
            type="info"
            showIcon
          />
        )}
      </Card>
      
      <Card style={{ marginTop: '20px' }}>
        <Title level={4}>如何查看日志：</Title>
        <ol>
          <li>访问 <a href="https://vercel.com/dashboard" target="_blank">Vercel Dashboard</a></li>
          <li>点击 eizokobo 项目</li>
          <li>点击最新的部署 URL</li>
          <li>在部署详情页面查找 "Runtime Logs" 或 "Real-time Logs"</li>
          <li>或者使用 CLI 命令：<Text code>vercel logs https://eizokobo-i2ukeu8z2-theonlyseans-projects.vercel.app</Text></li>
        </ol>
      </Card>
    </div>
  );
} 