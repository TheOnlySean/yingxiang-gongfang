'use client';

import { useState, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

export default function TestHydration() {
  const [mounted, setMounted] = useState(false);
  const { width, height, deviceType, isMobile, isTablet, isDesktop } = useResponsive();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <Title level={2}>Hydration 测试页面</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="挂载状态" style={{ width: '100%' }}>
          <Text>已挂载: {mounted ? '✅ 是' : '❌ 否'}</Text>
        </Card>

        <Card title="响应式状态" style={{ width: '100%' }}>
          <Space direction="vertical">
            <Text>宽度: {width}px</Text>
            <Text>高度: {height}px</Text>
            <Text>设备类型: {deviceType}</Text>
            <Text>移动设备: {isMobile ? '✅ 是' : '❌ 否'}</Text>
            <Text>平板设备: {isTablet ? '✅ 是' : '❌ 否'}</Text>
            <Text>桌面设备: {isDesktop ? '✅ 是' : '❌ 否'}</Text>
          </Space>
        </Card>

        <Card title="条件渲染测试" style={{ width: '100%' }}>
          {!mounted ? (
            <Text type="secondary">服务器端渲染 - 默认桌面版本</Text>
          ) : (
            <Space direction="vertical">
              <Text>客户端渲染 - 实际设备类型</Text>
              {isMobile && <Text style={{ color: '#1890ff' }}>📱 移动设备界面</Text>}
              {isTablet && <Text style={{ color: '#52c41a' }}>📱 平板设备界面</Text>}
              {isDesktop && <Text style={{ color: '#faad14' }}>🖥️ 桌面设备界面</Text>}
            </Space>
          )}
        </Card>
      </Space>
    </div>
  );
} 