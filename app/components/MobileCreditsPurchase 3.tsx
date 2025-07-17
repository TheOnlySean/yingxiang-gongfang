'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, message, Spin, Badge, Modal } from 'antd';
import { 
  CreditCardOutlined, StarOutlined, CrownOutlined, ThunderboltOutlined, 
  ArrowLeftOutlined, HomeOutlined, WalletOutlined
} from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import MobileLayout from './MobileLayout';

const { Title, Text, Paragraph } = Typography;

// 套餐配置
const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'スターター',
    credits: 1000,
    price: 750,
    originalPrice: 750,
    discount: 0,
    icon: <ThunderboltOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
    description: '初心者向け',
    features: [
      '1,000ポイント',
      'AI自動サポート',
      '安心の決済'
    ]
  },
  {
    id: 'standard',
    name: 'スタンダード',
    credits: 10000,
    price: 7500,
    originalPrice: 7500,
    discount: 0,
    icon: <StarOutlined style={{ fontSize: '20px', color: '#1890ff' }} />,
    description: '人気のプラン',
    popular: true,
    features: [
      '10,000ポイント',
      'AI自動サポート',
      'カスタマーサポート',
      '人気プラン'
    ]
  },
  {
    id: 'premium',
    name: 'プレミアム',
    credits: 100000,
    price: 70000,
    originalPrice: 75000,
    discount: 5000,
    icon: <CrownOutlined style={{ fontSize: '20px', color: '#faad14' }} />,
    description: 'プロフェッショナル向け',
    features: [
      '100,000ポイント',
      'AI優先サポート',
      '優先カスタマーサポート',
      '5,000円割引',
      '最大限にお得'
    ]
  }
];

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function MobileCreditsPurchase() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  // 获取用户余额
  useEffect(() => {
    const fetchUserBalance = async () => {
      console.log('💰 MobileCreditsPurchase - 开始获取用户余额');
      try {
        const token = localStorage.getItem('token');
        console.log('📱 Token from localStorage:', token ? 'Token存在' : 'Token为空');
        
        if (!token) {
          console.log('❌ 没有token，跳转到登录页');
          router.push('/auth/login');
          return;
        }

        console.log('🌐 发送用户余额请求...');
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📊 用户余额响应状态:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ 用户余额获取成功:', {
            id: data.id,
            email: data.email,
            credits: data.credits
          });
          setUserCredits(data.credits || 0);
        } else {
          console.log('❌ 用户余额获取失败，状态:', response.status);
          const errorData = await response.text();
          console.log('❌ 用户余额失败详情:', errorData);
          message.error('認証エラーが発生しました');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('💥 用户余额获取异常:', error);
        message.error('残高の取得に失敗しました');
        router.push('/auth/login');
      } finally {
        setLoadingBalance(false);
        console.log('🏁 用户余额获取完成');
      }
    };

    fetchUserBalance();
  }, [router]);

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);
      
      // 获取token
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('認証が必要です');
        router.push('/auth/login');
        return;
      }
      
      // 创建支付意图
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('支払い処理の初期化に失敗しました');
      }

      const { clientSecret } = await response.json();
      
      // 重定向到Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe初期化に失敗しました');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: clientSecret,
      });

      if (error) {
        throw error;
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      message.error(error.message || '支払い処理中にエラーが発生しました');
    } finally {
      setLoading(null);
    }
  };

  return (
    <MobileLayout
      header={{
        title: 'ポイント購入',
        showMenuButton: false,
        actions: (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
              style={{
                color: '#ffffff',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                padding: '6px 12px',
                fontSize: '14px',
                height: '36px',
              }}
            >
              戻る
            </Button>
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => router.push('/')}
              style={{
                color: '#ffffff',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                padding: '6px 12px',
                fontSize: '14px',
                height: '36px',
              }}
            >
              ホーム
            </Button>
          </div>
        ),
      }}
      content={{
        padding: false,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
      layout={{
        fullHeight: true,
        safeArea: true,
      }}
    >
      <div style={{ padding: '20px' }}>
        {/* 页面标题 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
            ポイント購入
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            動画生成に必要なポイントを購入しましょう
          </Text>
        </div>

        {/* 用户余额显示 */}
        <Card
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <WalletOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />
            <div>
              <Text style={{ color: '#ffffff', fontSize: '14px' }}>現在の残高</Text>
            </div>
            {loadingBalance ? (
              <Spin size="small" />
            ) : (
              <Title level={3} style={{ color: '#faad14', margin: '8px 0' }}>
                {userCredits?.toLocaleString() || 0} ポイント
              </Title>
            )}
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
              <Badge status="success" />
              ポイントは無期限
            </Text>
          </div>
        </Card>

        {/* 使用说明 */}
        <Card
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            marginBottom: '24px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <CreditCardOutlined style={{ fontSize: '20px', color: '#ffffff', marginRight: '8px' }} />
            <Text style={{ color: '#ffffff', fontSize: '14px' }}>
              動画生成: <strong style={{ color: '#ff6b7a' }}>300ポイント/回</strong>
            </Text>
            <div style={{ marginTop: '8px' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                安全な決済: Stripe
              </Text>
            </div>
          </div>
        </Card>

        {/* 套餐选择 */}
        <div style={{ marginBottom: '24px' }}>
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              style={{
                background: pkg.popular 
                  ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: pkg.popular ? '2px solid #faad14' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                position: 'relative',
                marginBottom: '16px'
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '16px',
                  background: '#faad14',
                  color: '#000',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  人気
                </div>
              )}

              <Row gutter={[16, 16]} align="middle">
                <Col flex="auto">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ marginRight: '12px' }}>
                      {pkg.icon}
                    </div>
                    <div>
                      <Title 
                        level={4} 
                        style={{ 
                          color: pkg.popular ? '#ffffff' : '#ffffff',
                          margin: 0,
                          fontSize: '16px'
                        }}
                      >
                        {pkg.name}
                      </Title>
                      <Text style={{ 
                        color: pkg.popular ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
                        fontSize: '12px'
                      }}>
                        {pkg.description}
                      </Text>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <Text style={{ 
                      color: pkg.popular ? '#ffffff' : '#ffffff',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {pkg.credits.toLocaleString()}ポイント
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {pkg.discount > 0 && (
                      <Text 
                        delete 
                        style={{ 
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '14px',
                          marginRight: '8px'
                        }}
                      >
                        ¥{pkg.originalPrice.toLocaleString()}
                      </Text>
                    )}
                    <Text 
                      style={{ 
                        color: pkg.popular ? '#ffffff' : '#ffffff',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      ¥{pkg.price.toLocaleString()}
                    </Text>
                    {pkg.discount > 0 && (
                      <Text style={{ 
                        color: '#52c41a',
                        fontSize: '12px',
                        marginLeft: '8px',
                        fontWeight: 'bold'
                      }}>
                        ¥{pkg.discount.toLocaleString()}お得
                      </Text>
                    )}
                  </div>
                </Col>
                
                <Col>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading === pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                    style={{
                      background: pkg.popular ? '#faad14' : '#e60033',
                      borderColor: pkg.popular ? '#faad14' : '#e60033',
                      color: '#ffffff',
                      minWidth: '80px',
                      minHeight: '44px',
                      fontWeight: 'bold',
                      borderRadius: '8px'
                    }}
                  >
                    {loading === pkg.id ? '処理中...' : '購入'}
                  </Button>
                </Col>
              </Row>
            </Card>
          ))}
        </div>

        {/* 注意事项 */}
        <Card
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Badge status="success" />
                <Text style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                  無期限
                </Text>
              </Col>
              <Col span={8}>
                <Badge status="processing" />
                <Text style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                  安全決済
                </Text>
              </Col>
              <Col span={8}>
                <Badge status="warning" />
                <Text style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                  失敗時返還
                </Text>
              </Col>
            </Row>
          </div>
        </Card>

        {/* 信息弹窗 */}
        <Modal
          title="ポイントについて"
          open={showInfo}
          onOk={() => setShowInfo(false)}
          onCancel={() => setShowInfo(false)}
          footer={[
            <Button 
              key="ok" 
              type="primary" 
              onClick={() => setShowInfo(false)}
              style={{
                background: '#1890ff',
                borderColor: '#1890ff',
                color: 'white',
                minHeight: '44px'
              }}
            >
              了解しました
            </Button>
          ]}
        >
          <div>
            <Paragraph>
              <strong>ポイントの使用について：</strong>
            </Paragraph>
            <ul style={{ lineHeight: '1.6' }}>
              <li>動画生成には300ポイントが必要です</li>
              <li>ポイントに有効期限はありません</li>
              <li>生成に失敗した場合、ポイントは自動的に返還されます</li>
              <li>ポイントの購入後の返金はできません</li>
            </ul>
          </div>
        </Modal>
      </div>
    </MobileLayout>
  );
} 