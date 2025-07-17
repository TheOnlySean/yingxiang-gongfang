'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { IAppState } from '@/types';

// 应用状态Context
const AppStateContext = createContext<IAppState | null>(null);

// 应用状态Provider
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<IAppState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    credits: 0,
    videos: [],
    currentVideo: null
  });

  // 初始化时检查用户状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 确保在客户端环境中执行
        if (typeof window === 'undefined') {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          // verify API直接返回用户数据，不像login API那样包装在data字段中
          setState(prev => ({
            ...prev,
            user: data,
            isAuthenticated: true,
            credits: data.credits,
            isLoading: false
          }));
        } else {
          localStorage.removeItem('token');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  return (
    <AppStateContext.Provider value={state}>
      {children}
    </AppStateContext.Provider>
  );
}

// 使用应用状态的Hook
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// 通知Context
interface INotificationState {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    autoClose?: boolean;
    duration?: number;
  }>;
  addNotification: (notification: Omit<INotificationState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<INotificationState | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<INotificationState['notifications']>([]);

  const addNotification = (notification: Omit<INotificationState['notifications'][0], 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // 自动关闭通知
    if (notification.autoClose !== false) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration || 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

// 使用通知的Hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// 主要Providers组件
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AppStateProvider>
  );
} 