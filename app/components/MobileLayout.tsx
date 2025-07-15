/**
 * 映像工房 - 移动端布局组件
 * 提供响应式布局基础，支持移动端、平板和桌面设备
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Drawer, Button, Affix } from 'antd';
import { MenuOutlined, CloseOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useResponsive, useMobileDetection } from '@/hooks/useResponsive';
import { responsiveStyles } from '@/lib/responsive';

const { Header, Content, Sider } = Layout;

interface MobileLayoutProps {
  children: React.ReactNode;
  
  // 头部配置
  header?: {
    title?: string;
    logo?: React.ReactNode;
    actions?: React.ReactNode;
    showMenuButton?: boolean;
    fixed?: boolean;
    transparent?: boolean;
  };
  
  // 侧边栏配置
  sider?: {
    content?: React.ReactNode;
    width?: number;
    placement?: 'left' | 'right';
    showOnDesktop?: boolean;
    showOnTablet?: boolean;
    showOnMobile?: boolean;
  };
  
  // 内容区域配置
  content?: {
    padding?: boolean;
    background?: string;
    scrollable?: boolean;
    centered?: boolean;
  };
  
  // 底部配置
  footer?: {
    content?: React.ReactNode;
    fixed?: boolean;
    transparent?: boolean;
  };
  
  // 浮动按钮配置
  floatingButton?: {
    icon?: React.ReactNode;
    onClick?: () => void;
    show?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  };
  
  // 布局配置
  layout?: {
    showBackToTop?: boolean;
    safeArea?: boolean;
    fullHeight?: boolean;
  };
  
  // 样式配置
  style?: React.CSSProperties;
  className?: string;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  header = {},
  sider = {},
  content = {},
  footer,
  floatingButton,
  layout = {},
  style = {},
  className = '',
}) => {
  const { deviceType, width } = useResponsive();
  const { isMobile, isTablet, isDesktop } = useMobileDetection();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 默认配置
  const defaultHeader = {
    title: '映像工房',
    showMenuButton: true,
    fixed: true,
    transparent: false,
    ...header,
  };

  const defaultSider = {
    width: 300,
    placement: 'left' as const,
    showOnDesktop: true,
    showOnTablet: false,
    showOnMobile: false,
    ...sider,
  };

  const defaultContent = {
    padding: true,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    scrollable: true,
    centered: false,
    ...content,
  };

  const defaultLayout = {
    showBackToTop: true,
    safeArea: true,
    fullHeight: true,
    ...layout,
  };

  // 监听滚动显示回到顶部按钮
  useEffect(() => {
    if (!defaultLayout.showBackToTop) return;

    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [defaultLayout.showBackToTop]);

  // 确定是否显示侧边栏
  const shouldShowSider = () => {
    if (!defaultSider.content) return false;
    if (isMobile) return defaultSider.showOnMobile;
    if (isTablet) return defaultSider.showOnTablet;
    if (isDesktop) return defaultSider.showOnDesktop;
    return false;
  };

  // 获取响应式样式
  const cardStyle = responsiveStyles.card(deviceType);
  const buttonStyle = responsiveStyles.button(deviceType);

  // 头部组件
  const renderHeader = () => {
    if (!defaultHeader.title && !defaultHeader.logo && !defaultHeader.actions) return null;

    const headerStyle: React.CSSProperties = {
      background: defaultHeader.transparent 
        ? 'rgba(26, 26, 26, 0.95)' 
        : 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '8px 16px' : '12px 24px',
      height: 'auto',
      minHeight: isMobile ? '48px' : '56px',
      position: defaultHeader.fixed ? 'fixed' : 'static',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    };

    return (
      <Header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 菜单按钮 */}
          {defaultHeader.showMenuButton && defaultSider.content && (!shouldShowSider() || isMobile) && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{
                color: '#ffffff',
                padding: '6px',
                minWidth: 'auto',
                height: 'auto',
              }}
            />
          )}
          
          {/* Logo */}
          {defaultHeader.logo && (
            <div>{defaultHeader.logo}</div>
          )}
          
          {/* 标题和广告语 */}
          {defaultHeader.title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: isMobile ? '14px' : '16px',
                color: '#ffffff',
                letterSpacing: '0.05em',
              }}>
                {defaultHeader.title}
              </div>
              <div style={{
                fontSize: isMobile ? '12px' : '14px',
                color: '#ffffff',
                opacity: 0.8,
                fontWeight: '500',
              }}>
                想像を映像に変える魔法
              </div>
            </div>
          )}
        </div>
        
        {/* 右侧操作区域 */}
        {defaultHeader.actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {defaultHeader.actions}
          </div>
        )}
      </Header>
    );
  };

  // 侧边栏组件
  const renderSider = () => {
    if (!defaultSider.content) return null;

    // 桌面端侧边栏
    if (shouldShowSider() && !isMobile) {
      return (
        <Sider
          width={defaultSider.width}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: defaultSider.placement === 'left' ? 0 : 'auto',
            right: defaultSider.placement === 'right' ? 0 : 'auto',
            top: defaultHeader.fixed ? (isMobile ? '48px' : '56px') : 0,
            zIndex: 100,
          }}
        >
          {defaultSider.content}
        </Sider>
      );
    }

    return null;
  };

  // 抽屉组件（移动端/平板）
  const renderDrawer = () => {
    if (!defaultSider.content) return null;

    return (
      <Drawer
        title={null}
        placement={defaultSider.placement}
        closable={false}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={isMobile ? Math.min(320, width * 0.8) : defaultSider.width}
        style={{
          background: 'transparent',
        }}
        bodyStyle={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '24px',
        }}
        headerStyle={{
          background: 'rgba(26, 26, 26, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        extra={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setDrawerVisible(false)}
            style={{
              color: '#ffffff',
              padding: '8px',
              minWidth: 'auto',
              height: 'auto',
            }}
          />
        }
      >
        {defaultSider.content}
      </Drawer>
    );
  };

  // 主内容样式
  const contentStyle: React.CSSProperties = {
    background: defaultContent.background,
    minHeight: defaultLayout.fullHeight ? '100vh' : 'auto',
    padding: defaultContent.padding ? (isMobile ? '16px' : '24px') : 0,
    paddingTop: defaultContent.padding ? (isMobile ? '24px' : '32px') : 0,
    marginLeft: shouldShowSider() && !isMobile && defaultSider.placement === 'left' ? defaultSider.width : 0,
    marginRight: shouldShowSider() && !isMobile && defaultSider.placement === 'right' ? defaultSider.width : 0,
    marginTop: defaultHeader.fixed ? (isMobile ? '48px' : '56px') : 0,
    marginBottom: footer?.fixed ? '60px' : 0,
    overflow: defaultContent.scrollable ? 'auto' : 'hidden',
  };

  // 安全区域样式
  const safeAreaStyle: React.CSSProperties = defaultLayout.safeArea ? {
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
  } : {};

  // 回到顶部按钮
  const renderBackToTop = () => {
    if (!showBackToTop || !defaultLayout.showBackToTop) return null;

    return (
      <Affix offsetBottom={floatingButton?.show ? 80 : 20}>
        <Button
          type="primary"
          shape="circle"
          icon={<ArrowUpOutlined />}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            ...buttonStyle,
            position: 'fixed',
            bottom: floatingButton?.show ? '80px' : '20px',
            right: '20px',
            zIndex: 999,
            background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(230, 0, 51, 0.3)',
            width: '48px',
            height: '48px',
          }}
        />
      </Affix>
    );
  };

  // 浮动按钮
  const renderFloatingButton = () => {
    if (!floatingButton?.show || !floatingButton.onClick) return null;

    const positions = {
      'bottom-right': { bottom: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
    };

    return (
      <Button
        type="primary"
        shape="circle"
        icon={floatingButton.icon}
        onClick={floatingButton.onClick}
        style={{
          ...buttonStyle,
          position: 'fixed',
          zIndex: 999,
          background: 'linear-gradient(135deg, #e60033, #ff6b7a)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(230, 0, 51, 0.3)',
          width: '56px',
          height: '56px',
          ...positions[floatingButton.position || 'bottom-right'],
        }}
      />
    );
  };

  // 底部组件
  const renderFooter = () => {
    if (!footer?.content) return null;

    const footerStyle: React.CSSProperties = {
      background: footer.transparent 
        ? 'rgba(26, 26, 26, 0.95)' 
        : 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(37, 37, 37, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: isMobile ? '12px 16px' : '16px 24px',
      position: footer.fixed ? 'fixed' : 'static',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    };

    return (
      <div style={footerStyle}>
        {footer.content}
      </div>
    );
  };

  return (
    <div 
      className={`mobile-layout ${className}`}
      style={{
        ...safeAreaStyle,
        ...style,
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        {renderHeader()}
        {renderSider()}
        {renderDrawer()}
        
        <Content style={contentStyle}>
          {defaultContent.centered ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 'calc(100vh - 120px)',
            }}>
              <div style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : '800px',
                ...cardStyle,
              }}>
                {children}
              </div>
            </div>
          ) : (
            children
          )}
        </Content>
        
        {renderFooter()}
        {renderBackToTop()}
        {renderFloatingButton()}
      </Layout>
    </div>
  );
};

export default MobileLayout; 