'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';

// 虚拟滚动Hook
export const useVirtualScroll = (items: any[], itemHeight: number, containerHeight: number) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleItems, setVisibleItems] = useState<any[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  useEffect(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const bufferSize = Math.ceil(visibleCount * 0.5);
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const end = Math.min(items.length, start + visibleCount + bufferSize * 2);
    
    setStartIndex(start);
    setEndIndex(end);
    setVisibleItems(items.slice(start, end));
  }, [scrollTop, items, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    startIndex,
    endIndex,
    handleScroll,
    totalHeight: items.length * itemHeight
  };
};

// 懒加载Hook
export const useLazyLoad = (threshold: number = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
        }
      },
      { threshold }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current);
      }
    };
  }, [threshold, hasLoaded]);

  return { targetRef, isIntersecting, hasLoaded };
};

// 触摸手势Hook
export const useTouch = () => {
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    deltaX: 0,
    deltaY: 0,
    distance: 0,
    isSwipe: false,
    direction: '',
    duration: 0
  });

  const touchStartTime = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStartTime.current = Date.now();
    setTouchState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      isSwipe: false,
      direction: ''
    }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    setTouchState(prev => ({
      ...prev,
      endX: touch.clientX,
      endY: touch.clientY,
      deltaX,
      deltaY,
      distance
    }));
  }, [touchState.startX, touchState.startY]);

  const handleTouchEnd = useCallback(() => {
    const endTime = Date.now();
    const deltaTime = endTime - touchStartTime.current;
    
    setTouchState(prev => ({
      ...prev,
      duration: deltaTime,
      isSwipe: Math.abs(prev.deltaX) > 50 || Math.abs(prev.deltaY) > 50,
      direction: Math.abs(prev.deltaX) > Math.abs(prev.deltaY) 
        ? (prev.deltaX > 0 ? 'right' : 'left')
        : (prev.deltaY > 0 ? 'down' : 'up')
    }));
  }, []);

  return {
    touchState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// 滚动到顶部Hook
export const useScrollToTop = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  return { showButton, scrollToTop };
};

// 性能监控Hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (now - lastTime))
        }));
        frameCount = 0;
        lastTime = now;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  const measureRenderTime = useCallback((callback: () => void) => {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    setMetrics(prev => ({
      ...prev,
      renderTime: endTime - startTime
    }));
  }, []);

  return { metrics, measureRenderTime };
};

// 图片懒加载组件
export const LazyImage: React.FC<{
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
}> = ({ src, alt, width, height, className, onLoad }) => {
  const { targetRef, isIntersecting } = useLazyLoad(0.1);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <div
      ref={targetRef}
      style={{
        width,
        height,
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      className={className}
    >
      {isIntersecting && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      {error && (
        <div style={{ color: '#999', fontSize: '14px' }}>
          画像を読み込めませんでした
        </div>
      )}
    </div>
  );
};

// 滚动到顶部按钮组件
export const ScrollToTopButton: React.FC = () => {
  const { showButton, scrollToTop } = useScrollToTop();

  if (!showButton) return null;

  return (
    <Button
      type="primary"
      icon={<ArrowUpOutlined />}
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
        border: 'none',
        boxShadow: '0 4px 12px rgba(230, 0, 51, 0.3)',
        animation: 'fadeInUp 0.3s ease'
      }}
    />
  );
};

// 触摸反馈组件
export const TouchFeedback: React.FC<{
  children: React.ReactNode;
  onTap?: () => void;
  onSwipe?: (direction: string) => void;
  className?: string;
}> = ({ children, onTap, onSwipe, className }) => {
  const { touchState, handleTouchStart, handleTouchMove, handleTouchEnd } = useTouch();
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    if (touchState.isSwipe && onSwipe) {
      onSwipe(touchState.direction);
    }
  }, [touchState.isSwipe, touchState.direction, onSwipe]);

  const handleTouchStartWithFeedback = useCallback((e: React.TouchEvent) => {
    setIsPressed(true);
    handleTouchStart(e);
  }, [handleTouchStart]);

  const handleTouchEndWithFeedback = useCallback((_: React.TouchEvent) => {
    setIsPressed(false);
    handleTouchEnd();
    
    if (!touchState.isSwipe && touchState.distance < 10 && onTap) {
      onTap();
    }
  }, [handleTouchEnd, touchState.isSwipe, touchState.distance, onTap]);

  return (
    <div
      className={className}
      onTouchStart={handleTouchStartWithFeedback}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndWithFeedback}
      style={{
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.1s ease',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </div>
  );
};

// 性能优化的CSS样式
export const MobileOptimizationStyles: React.FC = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* 滚动优化 */
      * {
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      
      /* 触摸优化 */
      button, [role="button"] {
        touch-action: manipulation;
      }
      
      /* 动画优化 */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      /* 优化的滚动条 */
      ::-webkit-scrollbar {
        width: 4px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(230, 0, 51, 0.5);
        border-radius: 2px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(230, 0, 51, 0.8);
      }
      
      /* 移动端优化 */
      @media (max-width: 768px) {
        * {
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }
        
        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
        }
        
        .smooth-scroll {
          scroll-behavior: smooth;
        }
        
        .will-change-transform {
          will-change: transform;
        }
        
        .gpu-accelerated {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
        }
      }
      
      /* 减少重排重绘 */
      .optimized-list {
        contain: layout style paint;
      }
      
      .optimized-item {
        contain: layout style;
      }
      
      /* 防止字体闪烁 */
      .font-display-swap {
        font-display: swap;
      }
      
      /* 图片优化 */
      .optimized-image {
        content-visibility: auto;
        contain-intrinsic-size: 200px;
      }
      
      /* 性能监控指示器 */
      .performance-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        opacity: 0.7;
        pointer-events: none;
      }
      
      /* 加载状态 */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* 响应式字体 */
      @media (max-width: 768px) {
        html {
          font-size: 14px;
        }
      }
      
      @media (max-width: 480px) {
        html {
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null;
};

// 性能监控显示组件
export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ enabled = false }) => {
  const { metrics } = usePerformanceMonitor();

  if (!enabled) return null;

  return (
    <div className="performance-indicator">
      <div>FPS: {metrics.fps}</div>
      <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
    </div>
  );
};

// 主要的优化组件
export const MobileOptimizations: React.FC<{
  children: React.ReactNode;
  enablePerformanceMonitor?: boolean;
}> = ({ children, enablePerformanceMonitor = false }) => {
  return (
    <>
      <MobileOptimizationStyles />
      {children}
      <ScrollToTopButton />
      <PerformanceMonitor enabled={enablePerformanceMonitor} />
    </>
  );
};

export default MobileOptimizations; 