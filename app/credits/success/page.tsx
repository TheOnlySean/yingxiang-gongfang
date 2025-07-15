'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Spin, Modal } from 'antd';
import { CheckCircleOutlined, ShoppingOutlined, PlayCircleOutlined, CreditCardOutlined, WalletOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResponsive } from '@/hooks/useResponsive';
import MobileCreditsSuccess from '@/app/components/MobileCreditsSuccess';

const { Title, Text, Paragraph } = Typography;

export default function CreditsSuccessPage() {
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isUpdating, setIsUpdating] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [shouldUseMobile, setShouldUseMobile] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useResponsive();

  // 处理挂载状态和设备类型检测
  useEffect(() => {
    setMounted(true);
    // 只在客户端挂载后检测设备类型
    setShouldUseMobile(isMobile || isTablet);
  }, [isMobile, isTablet]);

  // 如果还没有挂载，显示加载状态
  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // 挂载后根据设备类型选择组件
  if (shouldUseMobile) {
    return <MobileCreditsSuccess />;
  }

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10; // 最多重试10次
    let initialCredits: number | null = null;

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
          const currentCredits = data.credits || 0;
          
          // 记录初始积分
          if (initialCredits === null) {
            initialCredits = currentCredits;
          }
          
          setUserCredits(currentCredits);
          
          // 如果积分已经更新或者达到最大重试次数，停止重试
          if (currentCredits > (initialCredits || 0) || retryCount >= maxRetries) {
            setIsUpdating(false);
            return;
          }
          
          // 如果积分还没有更新，继续重试
          retryCount++;
          setTimeout(fetchUserBalance, 3000); // 3秒后重试
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchUserBalance, 3000);
        }
      }
    };

    const fetchPurchaseInfo = async () => {
      // 从URL参数获取购买信息（如果有的话）
      const sessionId = searchParams.get('session_id');
      if (sessionId) {
        // 根据sessionId获取购买详情
        try {
          const response = await fetch(`/api/stripe/session/${sessionId}`);
          if (response.ok) {
            const sessionData = await response.json();
            setPurchaseInfo({
              plan: sessionData.line_items?.[0]?.product?.name || 'スターター',
              credits: parseInt(sessionData.metadata?.credits || '1000'),
              amount: sessionData.amount_total || 750
            });
          } else {
            // 如果获取失败，使用默认数据
            setPurchaseInfo({
              plan: 'スターター',
              credits: 1000,
              amount: 750
            });
          }
        } catch (error) {
          console.error('Failed to fetch session data:', error);
          // 使用默认数据
          setPurchaseInfo({
            plan: 'スターター', 
            credits: 1000,
            amount: 750
          });
        }
      } else {
        // 如果没有sessionId，使用默认数据（这种情况不应该发生）
        setPurchaseInfo({
          plan: 'スターター',
          credits: 1000,
          amount: 750
        });
      }
    };

    fetchUserBalance();
    fetchPurchaseInfo();
  }, [router, searchParams]);

  const handleStartVideoGeneration = () => {
    // 添加参数让主页知道需要刷新积分
    router.push('/?refresh_credits=true');
  };

  const handleViewCredits = () => {
    // 跳转到积分购买页面查看更多套餐
    router.push('/credits/purchase');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* 成功卡片 */}
        <Card
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: 'none',
            borderRadius: '16px',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* 成功图标 */}
          <div style={{ marginBottom: '24px' }}>
            <CheckCircleOutlined 
              style={{ 
                fontSize: '64px', 
                color: '#52c41a',
                background: 'rgba(82, 196, 26, 0.1)',
                borderRadius: '50%',
                padding: '16px'
              }} 
            />
          </div>

          {/* 标题 */}
          <Title level={2} style={{ color: '#1f1f1f', marginBottom: '16px' }}>
            お支払いが完了しました！
          </Title>

          <Paragraph style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>
            ポイントの購入が正常に処理されました。<br/>
            すぐにご利用いただけます。
          </Paragraph>

          {/* 购买信息 */}
          {purchaseInfo && (
            <div style={{ 
              background: 'rgba(24, 144, 255, 0.08)',
              border: '1px solid rgba(24, 144, 255, 0.2)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <Row gutter={[16, 16]} justify="center">
                <Col span={8}>
                  <Text style={{ color: '#666', display: 'block' }}>購入プラン:</Text>
                  <Title level={4} style={{ color: '#1f1f1f', margin: '4px 0' }}>
                    {purchaseInfo.plan}
                  </Title>
                </Col>
                <Col span={8}>
                  <Text style={{ color: '#666', display: 'block' }}>獲得ポイント:</Text>
                  <Title level={4} style={{ color: '#1890ff', margin: '4px 0' }}>
                    <CreditCardOutlined style={{ marginRight: '8px' }} />
                    {purchaseInfo.credits.toLocaleString()}
                  </Title>
                </Col>
                <Col span={8}>
                  <Text style={{ color: '#666', display: 'block' }}>お支払い金額:</Text>
                  <Title level={4} style={{ color: '#52c41a', margin: '4px 0' }}>
                    ¥{purchaseInfo.amount.toLocaleString()}
                  </Title>
                </Col>
              </Row>
            </div>
          )}

          {/* 当前余额显示 */}
          <div style={{ 
            background: 'rgba(250, 173, 20, 0.08)',
            border: '1px solid rgba(250, 173, 20, 0.2)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '32px'
          }}>
            <Row justify="center" align="middle">
              <Col>
                <WalletOutlined style={{ fontSize: '24px', color: '#faad14', marginRight: '12px' }} />
              </Col>
              <Col>
                <Text style={{ color: '#666', display: 'block', fontSize: '14px' }}>
                  現在の残高 {isUpdating && <Text style={{ color: '#1890ff', fontSize: '12px' }}>(更新中...)</Text>}
                </Text>
                {userCredits !== null ? (
                  <Title level={3} style={{ color: '#faad14', margin: '0' }}>
                    {userCredits.toLocaleString()} ポイント
                  </Title>
                ) : (
                  <Spin size="small" />
                )}
              </Col>
            </Row>
          </div>

          {/* 操作按钮 */}
          <Row gutter={[16, 16]} justify="center">
            <Col xs={24} sm={12}>
              <Button
                type="primary"
                size="large"
                block
                icon={<PlayCircleOutlined />}
                onClick={handleStartVideoGeneration}
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                動画生成を開始
              </Button>
            </Col>
            <Col xs={24} sm={12}>
              <Button
                size="large"
                block
                icon={<ShoppingOutlined />}
                onClick={handleViewCredits}
                style={{
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#1890ff',
                  borderColor: '#1890ff',
                  color: '#ffffff'
                }}
              >
                ポイントを確認
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 提示信息 */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button 
            type="link" 
            onClick={() => setShowInfo(true)}
            style={{ 
              color: 'rgba(255,255,255,0.8)',
              fontSize: '14px'
            }}
          >
            💡 ポイントの使用方法について
          </Button>
        </div>

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
                color: 'white'
              }}
            >
              了解しました
            </Button>
          ]}
          styles={{
            content: {
              background: 'white',
              color: '#1f1f1f'
            }
          }}
        >
          <div style={{ color: '#1f1f1f' }}>
            <Paragraph style={{ color: '#1f1f1f' }}>
              <strong>ポイントの使用について：</strong>
            </Paragraph>
            <ul style={{ color: '#666', lineHeight: '1.6' }}>
              <li>動画生成には300ポイントが必要です</li>
              <li>ポイントに有効期限はありません</li>
              <li>生成に失敗した場合、ポイントは自動的に返還されます</li>
              <li>ポイントの購入後の返金はできません</li>
            </ul>
          </div>
        </Modal>
      </div>
    </div>
  );
}
