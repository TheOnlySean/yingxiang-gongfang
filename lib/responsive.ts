/**
 * 映像工房 - 响应式工具函数库
 * 提供断点系统和响应式工具函数
 */

// 断点配置
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

// 移动端断点
export const mobileBreakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;

// 设备类型
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

// 断点类型
export type BreakpointKey = keyof typeof breakpoints;

// 获取当前设备类型
export const getDeviceType = (width: number): DeviceType => {
  if (width < mobileBreakpoints.mobile) return 'mobile';
  if (width < mobileBreakpoints.tablet) return 'tablet';
  return 'desktop';
};

// 检查是否为移动设备
export const isMobile = (width: number): boolean => {
  return width < mobileBreakpoints.mobile;
};

// 检查是否为平板设备
export const isTablet = (width: number): boolean => {
  return width >= mobileBreakpoints.mobile && width < mobileBreakpoints.tablet;
};

// 检查是否为桌面设备
export const isDesktop = (width: number): boolean => {
  return width >= mobileBreakpoints.desktop;
};

// 获取断点匹配函数
export const createBreakpointMatcher = (breakpoint: BreakpointKey) => {
  return (width: number): boolean => {
    return width >= breakpoints[breakpoint];
  };
};

// 响应式值选择器
export const responsiveValue = <T>(
  values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
  },
  deviceType: DeviceType
): T | undefined => {
  const { mobile, tablet, desktop } = values;
  
  switch (deviceType) {
    case 'mobile':
      return mobile ?? tablet ?? desktop;
    case 'tablet':
      return tablet ?? desktop ?? mobile;
    case 'desktop':
      return desktop ?? tablet ?? mobile;
    default:
      return desktop ?? tablet ?? mobile;
  }
};

// 响应式样式生成器
export const responsiveStyles = {
  // 容器样式
  container: (deviceType: DeviceType) => ({
    maxWidth: responsiveValue(
      { mobile: '100%', tablet: '768px', desktop: '1200px' },
      deviceType
    ),
    margin: '0 auto',
    padding: responsiveValue(
      { mobile: '16px', tablet: '24px', desktop: '32px' },
      deviceType
    ),
  }),

  // 网格系统
  grid: (deviceType: DeviceType) => ({
    display: 'grid',
    gap: responsiveValue(
      { mobile: '12px', tablet: '16px', desktop: '24px' },
      deviceType
    ),
  }),

  // 弹性布局
  flex: (deviceType: DeviceType) => ({
    display: 'flex',
    gap: responsiveValue(
      { mobile: '8px', tablet: '12px', desktop: '16px' },
      deviceType
    ),
  }),

  // 文字大小
  fontSize: (deviceType: DeviceType) => ({
    fontSize: responsiveValue(
      { mobile: '14px', tablet: '16px', desktop: '16px' },
      deviceType
    ),
  }),

  // 按钮样式
  button: (deviceType: DeviceType) => ({
    padding: responsiveValue(
      { mobile: '12px 16px', tablet: '12px 20px', desktop: '12px 24px' },
      deviceType
    ),
    fontSize: responsiveValue(
      { mobile: '14px', tablet: '16px', desktop: '16px' },
      deviceType
    ),
    minHeight: responsiveValue(
      { mobile: '44px', tablet: '44px', desktop: '40px' },
      deviceType
    ),
  }),

  // 卡片样式
  card: (deviceType: DeviceType) => ({
    padding: responsiveValue(
      { mobile: '16px', tablet: '20px', desktop: '24px' },
      deviceType
    ),
    borderRadius: responsiveValue(
      { mobile: '12px', tablet: '16px', desktop: '16px' },
      deviceType
    ),
  }),

  // 输入框样式
  input: (deviceType: DeviceType) => ({
    padding: responsiveValue(
      { mobile: '12px 16px', tablet: '12px 16px', desktop: '10px 16px' },
      deviceType
    ),
    fontSize: responsiveValue(
      { mobile: '16px', tablet: '16px', desktop: '14px' },
      deviceType
    ),
    minHeight: responsiveValue(
      { mobile: '44px', tablet: '44px', desktop: '40px' },
      deviceType
    ),
  }),
};

// 媒体查询生成器
export const mediaQuery = {
  mobile: `@media (max-width: ${mobileBreakpoints.mobile - 1}px)`,
  tablet: `@media (min-width: ${mobileBreakpoints.mobile}px) and (max-width: ${mobileBreakpoints.tablet - 1}px)`,
  desktop: `@media (min-width: ${mobileBreakpoints.desktop}px)`,
  mobileAndTablet: `@media (max-width: ${mobileBreakpoints.tablet - 1}px)`,
  tabletAndDesktop: `@media (min-width: ${mobileBreakpoints.mobile}px)`,
};

// 触摸设备检测
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// 用户代理检测
export const getUserAgent = () => {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent;
};

// 检查是否为移动浏览器
export const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = getUserAgent();
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

// 获取视口尺寸
export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 1200, height: 800 }; // 服务器端默认使用桌面设备尺寸
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

// 获取屏幕方向
export const getScreenOrientation = (): 'portrait' | 'landscape' => {
  if (typeof window === 'undefined') return 'landscape'; // 服务器端默认横屏（桌面设备）
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

// 响应式配置
export const responsiveConfig = {
  // Ant Design 响应式配置
  antd: {
    xs: { span: 24 },
    sm: { span: 24 },
    md: { span: 12 },
    lg: { span: 8 },
    xl: { span: 6 },
  },
  
  // 网格列数配置
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  
  // 侧边栏配置
  sider: {
    mobile: { width: 0, collapsed: true },
    tablet: { width: 300, collapsed: false },
    desktop: { width: 450, collapsed: false },
  },
};

export default {
  breakpoints,
  mobileBreakpoints,
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  responsiveValue,
  responsiveStyles,
  mediaQuery,
  isTouchDevice,
  isMobileBrowser,
  getViewportSize,
  getScreenOrientation,
  responsiveConfig,
}; 