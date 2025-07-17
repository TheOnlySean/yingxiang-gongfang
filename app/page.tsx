'use client'

import { useState, useEffect } from 'react';
import WorkingPlayground from './components/WorkingPlayground';
import WorkingPlaygroundMobile from './components/WorkingPlaygroundMobile';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 简单的移动端检测
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 服务器端渲染时显示桌面版本
  if (!mounted) {
    return <WorkingPlayground />;
  }

  // 客户端渲染时根据设备类型选择组件
  if (isMobile) {
    return <WorkingPlaygroundMobile />;
  }

  return <WorkingPlayground />;
} 