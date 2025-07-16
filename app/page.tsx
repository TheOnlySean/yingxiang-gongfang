'use client'

import { useState, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import WorkingPlayground from './components/WorkingPlayground';
import WorkingPlaygroundMobile from './components/WorkingPlaygroundMobile';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  // 避免hydration错误 - 等待客户端mount后再进行响应式判断
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在服务器端渲染时，显示默认的桌面版本
  if (!mounted) {
    return <WorkingPlayground />;
  }

  // 客户端渲染时，根据设备类型选择组件
  // 移动端和平板使用移动端优化版本（不管是否登录）
  if (isMobile || isTablet) {
    return <WorkingPlaygroundMobile />;
  }

  // 桌面端使用原版本
  return <WorkingPlayground />;
} 