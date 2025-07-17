'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Spin, Modal, Badge } from 'antd';
import { 
  CheckCircleOutlined, ShoppingOutlined, PlayCircleOutlined, 
  WalletOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileLayout from './MobileLayout';

const { Title, Text, Paragraph } = Typography;

export default function MobileCreditsSuccess() {
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [isUpdating, setIsUpdating] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 处理挂载状态
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取用户数据 - 只在挂载后执行
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted, router, searchParams]);

  const handleStartVideoGeneration = () => {
    // 添加参数让主页知道需要刷新积分
    router.push('/?refresh_credits=true');
  };

  const handleViewCredits = () => {
    // 跳转到积分购买页面查看更多套餐
    router.push('/credits/purchase');
  };

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

  return (
    <MobileLayout
      header={{
        title: '支払い完了',
        actions: (
          <Button 
            type="text" 
            icon={<InfoCircleOutlined />}
            onClick={() => setShowInfo(true)}
            style={{ 
              color: '#ffffff',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '8px'
            }}
          />
        )
      }}
    >
      <div style={{ padding: '20px', textAlign: 'center' }}>
        {/* 成功图标 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #52c41a, #73d13d)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <CheckCircleOutlined style={{ fontSize: '40px', color: '#ffffff' }} />
          </div>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
            お支払い完了！
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            ポイントの購入が正常に処理されました
          </Text>
        </div>

        {/* 购买信息 */}
        {purchaseInfo && (
          <Card style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <Row gutter={[16, 16]} style={{ textAlign: 'center' }}>
              <Col span={24}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  購入プラン
                </Text>
                <div>
                  <Title level={4} style={{ color: '#ffffff', margin: '4px 0' }}>
                    {purchaseInfo.plan}
                  </Title>
                </div>
              </Col>
              <Col span={12}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  獲得ポイント
                </Text>
                <div>
                  <Text style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                    {purchaseInfo.credits.toLocaleString()}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                  お支払い金額
                </Text>
                <div>
                  <Text style={{ color: '#52c41a', fontSize: '18px', fontWeight: 'bold' }}>
                    ¥{purchaseInfo.amount.toLocaleString()}
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* 当前余额显示 */}
        <Card style={{
          background: 'rgba(250, 173, 20, 0.1)',
          border: '1px solid rgba(250, 173, 20, 0.3)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <WalletOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
            <div>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                現在の残高 
                {isUpdating && (
                  <Text style={{ color: '#1890ff', fontSize: '12px', marginLeft: '4px' }}>
                    (更新中...)
                  </Text>
                )}
              </Text>
            </div>
            {userCredits !== null ? (
              <Title level={3} style={{ color: '#faad14', margin: '8px 0' }}>
                {userCredits.toLocaleString()} ポイント
              </Title>
            ) : (
              <div style={{ padding: '12px 0' }}>
                <Spin size="small" />
              </div>
            )}
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              <Badge status="success" />
              ポイントは無期限有効
            </Text>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            type="primary"
            size="large"
            block
            icon={<PlayCircleOutlined />}
            onClick={handleStartVideoGeneration}
            style={{
              background: 'linear-gradient(135deg, #52c41a, #73d13d)',
              borderColor: 'transparent',
              color: '#ffffff',
              minHeight: '48px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px',
              marginBottom: '12px'
            }}
          >
            動画生成を開始
          </Button>
          
          <Button
            size="large"
            block
            icon={<ShoppingOutlined />}
            onClick={handleViewCredits}
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#ffffff',
              minHeight: '48px',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px'
            }}
          >
            ポイントを確認
          </Button>
        </div>

        {/* 使用说明 */}
        <Card style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px'
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            💡 動画生成には300ポイントが必要です
          </Text>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              生成に失敗した場合、ポイントは自動的に返還されます
            </Text>
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