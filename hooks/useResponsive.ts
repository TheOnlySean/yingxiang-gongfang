/**
 * 映像工房 - 响应式Hook
 * 提供设备类型检测和响应式状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getDeviceType, 
  isMobile, 
  isTablet, 
  isDesktop, 
  getViewportSize, 
  getScreenOrientation,
  isTouchDevice,
  isMobileBrowser,
  responsiveValue,
  responsiveStyles,
  responsiveConfig,
  type DeviceType 
} from '@/lib/responsive';

// 响应式状态接口
interface ResponsiveState {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  isMobileBrowser: boolean;
}

// 响应式Hook
export const useResponsive = () => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // 服务器端使用安全的默认值
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        isTouchDevice: false,
        isMobileBrowser: false,
      };
    }
    
    const { width, height } = getViewportSize();
    const deviceType = getDeviceType(width);
    
    return {
      width,
      height,
      deviceType,
      isMobile: isMobile(width),
      isTablet: isTablet(width),
      isDesktop: isDesktop(width),
      orientation: getScreenOrientation(),
      isTouchDevice: isTouchDevice(),
      isMobileBrowser: isMobileBrowser(),
    };
  });

  const [mounted, setMounted] = useState(false);

  // 客户端mount后立即更新状态
  useEffect(() => {
    setMounted(true);
    updateState(); // 立即更新到客户端实际状态
  }, []);

  // 更新响应式状态
  const updateState = useCallback(() => {
    const { width, height } = getViewportSize();
    const deviceType = getDeviceType(width);
    
    setState({
      width,
      height,
      deviceType,
      isMobile: isMobile(width),
      isTablet: isTablet(width),
      isDesktop: isDesktop(width),
      orientation: getScreenOrientation(),
      isTouchDevice: isTouchDevice(),
      isMobileBrowser: isMobileBrowser(),
    });
  }, []);

  // 监听窗口大小变化
  useEffect(() => {
    if (!mounted) return;
    
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, 150); // 防抖
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateState, mounted]);

  // 响应式值选择器
  const getResponsiveValue = useCallback(<T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  }): T | undefined => {
    return responsiveValue(values, state.deviceType);
  }, [state.deviceType]);

  // 获取响应式样式
  const getResponsiveStyles = useCallback(() => {
    return {
      container: responsiveStyles.container(state.deviceType),
      grid: responsiveStyles.grid(state.deviceType),
      flex: responsiveStyles.flex(state.deviceType),
      fontSize: responsiveStyles.fontSize(state.deviceType),
      button: responsiveStyles.button(state.deviceType),
      card: responsiveStyles.card(state.deviceType),
      input: responsiveStyles.input(state.deviceType),
    };
  }, [state.deviceType]);

  // 获取响应式配置
  const getResponsiveConfig = useCallback(() => {
    return {
      antd: responsiveConfig.antd,
      gridColumns: responsiveConfig.gridColumns[state.deviceType],
      sider: responsiveConfig.sider[state.deviceType],
    };
  }, [state.deviceType]);

  return {
    ...state,
    getResponsiveValue,
    getResponsiveStyles,
    getResponsiveConfig,
  };
};

// 设备类型Hook
export const useDeviceType = (): DeviceType => {
  const { deviceType } = useResponsive();
  return deviceType;
};

// 移动设备检测Hook
export const useMobileDetection = () => {
  const { isMobile, isTablet, isDesktop, isTouchDevice, isMobileBrowser } = useResponsive();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isMobileBrowser,
    isMobileDevice: isMobile || isMobileBrowser,
  };
};

// 屏幕方向Hook
export const useScreenOrientation = () => {
  const { orientation, width, height } = useResponsive();
  
  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
    width,
    height,
  };
};

// 断点匹配Hook
export const useBreakpoint = () => {
  const { width, deviceType } = useResponsive();
  
  const matches = useCallback((breakpoint: DeviceType) => {
    switch (breakpoint) {
      case 'mobile':
        return width < 768;
      case 'tablet':
        return width >= 768 && width < 1024;
      case 'desktop':
        return width >= 1024;
      default:
        return false;
    }
  }, [width]);

  const between = useCallback((min: DeviceType, max: DeviceType) => {
    const minWidth = min === 'mobile' ? 0 : min === 'tablet' ? 768 : 1024;
    const maxWidth = max === 'mobile' ? 767 : max === 'tablet' ? 1023 : Infinity;
    return width >= minWidth && width <= maxWidth;
  }, [width]);

  const up = useCallback((breakpoint: DeviceType) => {
    const minWidth = breakpoint === 'mobile' ? 0 : breakpoint === 'tablet' ? 768 : 1024;
    return width >= minWidth;
  }, [width]);

  const down = useCallback((breakpoint: DeviceType) => {
    const maxWidth = breakpoint === 'mobile' ? 767 : breakpoint === 'tablet' ? 1023 : Infinity;
    return width <= maxWidth;
  }, [width]);

  return {
    currentBreakpoint: deviceType,
    matches,
    between,
    up,
    down,
  };
};

// 响应式样式Hook
export const useResponsiveStyles = () => {
  const { getResponsiveStyles } = useResponsive();
  return getResponsiveStyles();
};

// 响应式配置Hook
export const useResponsiveConfig = () => {
  const { getResponsiveConfig } = useResponsive();
  return getResponsiveConfig();
};

// 媒体查询Hook
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// 窗口大小Hook
export const useWindowSize = () => {
  const { width, height } = useResponsive();
  
  return {
    width,
    height,
    aspectRatio: width / height,
  };
};

// 触摸设备Hook
export const useTouchDevice = () => {
  const { isTouchDevice } = useResponsive();
  
  return {
    isTouchDevice,
    supportsHover: !isTouchDevice,
  };
};

// 默认导出
export default useResponsive; 