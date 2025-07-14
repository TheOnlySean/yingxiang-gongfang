'use client';

import React from 'react';
import { Modal, Button, Typography, Space, Divider, Card, Row, Col, Tag } from 'antd';
import { 
  CrownOutlined, 
  CheckOutlined, 
  ClockCircleOutlined,
  CloudDownloadOutlined,
  StarOutlined,
  ThunderboltOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface PremiumUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumUpgradeModal({ 
  visible, 
  onClose, 
  onUpgrade 
}: PremiumUpgradeModalProps) {
  
  const features = {
    free: [
      { icon: <ClockCircleOutlined />, text: '视频保存14天', highlight: false },
      { icon: <CloudDownloadOutlined />, text: '最多保存10个视频', highlight: false },
      { icon: <StarOutlined />, text: '标准画质', highlight: false },
      { icon: <ThunderboltOutlined />, text: '普通处理速度', highlight: false }
    ],
    premium: [
      { icon: <ClockCircleOutlined />, text: '视频保存60天', highlight: true },
      { icon: <CloudDownloadOutlined />, text: '最多保存100个视频', highlight: true },
      { icon: <StarOutlined />, text: '高清画质', highlight: true },
      { icon: <ThunderboltOutlined />, text: '优先处理队列', highlight: true },
      { icon: <CheckOutlined />, text: '批量下载功能', highlight: true },
      { icon: <CheckOutlined />, text: '无水印视频', highlight: true }
    ]
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      styles={{
        body: { padding: '32px' }
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <CrownOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
        <Title level={2} style={{ marginBottom: '8px' }}>
          升级到 Premium
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          解锁更长的视频保存期和高级功能
        </Text>
      </div>

      <Row gutter={24}>
        {/* 免费版 */}
        <Col span={12}>
          <Card
            title={
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>免费版</Title>
                <Text type="secondary">当前计划</Text>
              </div>
            }
            style={{ height: '400px' }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ margin: 0 }}>¥0</Title>
              <Text type="secondary">永久免费</Text>
            </div>
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {features.free.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#52c41a' }}>{feature.icon}</span>
                  <Text>{feature.text}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Premium版 */}
        <Col span={12}>
          <Card
            title={
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                  <CrownOutlined style={{ marginRight: '8px' }} />
                  Premium
                </Title>
                <Tag color="gold">推荐</Tag>
              </div>
            }
            style={{ 
              height: '400px',
              border: '2px solid #faad14',
              position: 'relative'
            }}
            bodyStyle={{ padding: '20px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ margin: 0, color: '#faad14' }}>¥29</Title>
              <Text type="secondary">每月</Text>
            </div>
            
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {features.premium.map((feature, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: feature.highlight ? '#faad14' : '#52c41a' }}>
                    {feature.icon}
                  </span>
                  <Text style={{ 
                    fontWeight: feature.highlight ? '500' : 'normal',
                    color: feature.highlight ? '#faad14' : undefined
                  }}>
                    {feature.text}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* 升级说明 */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.1), rgba(255, 193, 7, 0.1))',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <Title level={5} style={{ marginBottom: '12px' }}>
          <ClockCircleOutlined style={{ marginRight: '8px', color: '#faad14' }} />
          为什么需要Premium？
        </Title>
        <Text style={{ lineHeight: '1.6' }}>
          由于KIE.AI的技术限制，生成的视频在其服务器上只保存14天。
          升级到Premium后，我们会自动将您的视频下载到我们的高速服务器，
          为您提供60天的安全存储，确保您的创作不会丢失。
        </Text>
      </div>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Space size="large">
          <Button size="large" onClick={onClose}>
            稍后决定
          </Button>
          <Button 
            type="primary" 
            size="large" 
            icon={<CrownOutlined />}
            style={{
              background: 'linear-gradient(135deg, #faad14, #ffc107)',
              border: 'none',
              fontWeight: '500'
            }}
            onClick={onUpgrade}
          >
            立即升级到Premium
          </Button>
        </Space>
      </div>
    </Modal>
  );
} 