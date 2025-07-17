'use client';

import React, { useState, useEffect } from 'react';
import { Typography } from 'antd';
import MobileLayout from './MobileLayout';
import MobileAuthSystem from './MobileAuthSystem';

const { Text } = Typography;

export default function SimpleMobilePlayground() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟认证检查
    setTimeout(() => {
      setIsAuthenticated(true);
      setLoading(false);
    }, 1000);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Text style={{ color: '#ffffff' }}>読み込み中...</Text>
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileLayout>
        <MobileAuthSystem onAuthSuccess={handleAuthSuccess} />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text style={{ color: '#ffffff' }}>
          SimpleMobilePlayground - 认证成功！
        </Text>
      </div>
    </MobileLayout>
  );
} 