'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, message, Spin, Badge } from 'antd';
import { CreditCardOutlined, StarOutlined, CrownOutlined, ThunderboltOutlined, ArrowLeftOutlined, HomeOutlined, WalletOutlined } from '@ant-design/icons';
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';

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
    icon: <ThunderboltOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
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
    icon: <StarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
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
    icon: <CrownOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
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

export default function CreditsPurchasePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const router = useRouter();

  // 获取用户余额
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserCredits(data.credits || 0);
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
        message.error('残高の取得に失敗しました');
      } finally {
        setLoadingBalance(false);
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px',
          padding: '0 10px'
        }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
            size="large"
          >
            戻る
          </Button>
          <Button 
            icon={<HomeOutlined />} 
            onClick={() => router.push('/')}
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              backdropFilter: 'blur(10px)'
            }}
            size="large"
          >
            ホーム
          </Button>
        </div>

        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
            ポイント購入
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px' }}>
            動画生成に必要なポイントを購入して、創造力を解き放ちましょう
          </Paragraph>
        </div>

        {/* Balance Information */}
        <Row gutter={[24, 24]} justify="center" style={{ marginBottom: '30px' }}>
          <Col xs={24} sm={12} md={8}>
            <Card
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                textAlign: 'center'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <WalletOutlined style={{ fontSize: '32px', color: '#faad14' }} />
              </div>
              <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>
                現在の残高
              </Title>
              {loadingBalance ? (
                <Spin size="small" />
              ) : (
                <Title level={2} style={{ color: '#faad14', margin: '0' }}>
                  {userCredits?.toLocaleString() || 0} ポイント
                </Title>
              )}
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginTop: '8px' }}>
                <span style={{ color: '#52c41a', marginRight: '4px' }}>●</span>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>ポイントは無期限</span>
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 価格情報 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none',
            backdropFilter: 'blur(10px)'
          }}>
            <Row gutter={[24, 24]} justify="center">
              <Col>
                <Text style={{ color: 'white', fontSize: '16px' }}>
                  <CreditCardOutlined style={{ marginRight: '8px' }} />
                  動画生成: <strong>300ポイント/回</strong>
                </Text>
              </Col>
              <Col>
                <Text style={{ color: 'white', fontSize: '16px' }}>
                  安全な決済: <strong>Stripe</strong>
                </Text>
              </Col>
            </Row>
          </Card>
        </div>

        {/* 套餐选择 */}
        <Row gutter={[24, 24]} justify="center">
          {CREDIT_PACKAGES.map((pkg) => (
            <Col key={pkg.id} xs={24} sm={12} lg={8}>
              <Card
                style={{
                  height: '100%',
                  background: pkg.popular 
                    ? 'linear-gradient(145deg, #1890ff, #40a9ff)'
                    : 'rgba(255, 255, 255, 0.95)',
                  border: pkg.popular ? '2px solid #faad14' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  position: 'relative',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                  boxShadow: pkg.popular 
                    ? '0 8px 24px rgba(24, 144, 255, 0.3)'
                    : '0 4px 12px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(10px)'
                }}
                bodyStyle={{ padding: '24px' }}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {pkg.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#faad14',
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    人気
                  </div>
                )}

                <div style={{ textAlign: 'center' }}>
                  {/* アイコン */}
                  <div style={{ marginBottom: '16px' }}>
                    {pkg.icon}
                  </div>

                  {/* プラン名 */}
                  <Title 
                    level={3} 
                    style={{ 
                      color: pkg.popular ? 'white' : '#1f1f1f',
                      marginBottom: '8px'
                    }}
                  >
                    {pkg.name}
                  </Title>

                  {/* 説明 */}
                  <Text style={{ 
                    color: pkg.popular ? 'rgba(255,255,255,0.8)' : '#666',
                    display: 'block',
                    marginBottom: '16px'
                  }}>
                    {pkg.description}
                  </Text>

                  {/* 価格 */}
                  <div style={{ marginBottom: '24px' }}>
                    {pkg.discount > 0 && (
                      <Text 
                        delete 
                        style={{ 
                          color: pkg.popular ? 'rgba(255,255,255,0.6)' : '#999',
                          fontSize: '16px',
                          marginRight: '8px'
                        }}
                      >
                        ¥{pkg.originalPrice.toLocaleString()}
                      </Text>
                    )}
                    <Title 
                      level={2} 
                      style={{ 
                        color: pkg.popular ? 'white' : '#1f1f1f',
                        margin: '0',
                        display: 'inline'
                      }}
                    >
                      ¥{pkg.price.toLocaleString()}
                    </Title>
                    {pkg.discount > 0 && (
                      <Text style={{ 
                        color: '#52c41a',
                        fontSize: '14px',
                        marginLeft: '8px',
                        fontWeight: 'bold'
                      }}>
                        ¥{pkg.discount.toLocaleString()}お得
                      </Text>
                    )}
                  </div>

                  {/* クレジット数 */}
                  <div style={{ 
                    background: pkg.popular ? 'rgba(255,255,255,0.2)' : 'rgba(24, 144, 255, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    border: pkg.popular ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(24, 144, 255, 0.2)'
                  }}>
                    <Title 
                      level={4} 
                      style={{ 
                        color: pkg.popular ? 'white' : '#1890ff',
                        margin: '0',
                        fontWeight: 'bold'
                      }}
                    >
                      {pkg.credits.toLocaleString()}ポイント
                    </Title>
                  </div>

                  {/* 特徴リスト */}
                  <div style={{ textAlign: 'left', marginBottom: '24px' }}>
                    {pkg.features.map((feature, index) => (
                      <div key={index} style={{ marginBottom: '8px' }}>
                        <Text style={{ 
                          color: pkg.popular ? 'rgba(255,255,255,0.9)' : '#666'
                        }}>
                          ✓ {feature}
                        </Text>
                      </div>
                    ))}
                  </div>

                  {/* 购买按钮 - 修复颜色问题 */}
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={loading === pkg.id}
                    onClick={() => handlePurchase(pkg.id)}
                    style={{
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      background: pkg.popular ? '#faad14' : '#1890ff',
                      borderColor: pkg.popular ? '#faad14' : '#1890ff',
                      color: 'white',
                      marginBottom: '12px'
                    }}
                  >
                    {loading === pkg.id ? (
                      <>
                        <Spin size="small" style={{ marginRight: '8px' }} />
                        処理中...
                      </>
                    ) : (
                      <>
                        <CreditCardOutlined style={{ marginRight: '8px' }} />
                        購入する
                      </>
                    )}
                  </Button>
                  
                  {/* 重要提醒 */}
                  <Text style={{ 
                    color: pkg.popular ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                    fontSize: '12px',
                    display: 'block',
                    textAlign: 'center',
                    lineHeight: '1.4'
                  }}>
                    ※ 一度購入されたポイントの返金はできません
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 注意事项 - 优化提醒信息 */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Card style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none',
            backdropFilter: 'blur(10px)'
          }}>
            <Row gutter={[16, 16]} justify="center">
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Badge status="success" />
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>
                    ポイント無期限
                  </Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    いつでもご利用いただけます
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Badge status="processing" />
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>
                    安全決済
                  </Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    Stripeで安心お支払い
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Badge status="warning" />
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 'bold' }}>
                    ポイント返還
                  </Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    生成失敗時はポイント返還
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </div>
  );
}
