/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 自定义断点
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // 映像工房专用断点
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
        // 特殊用途断点
        'mobile-portrait': {'max': '767px', 'orientation': 'portrait'},
        'mobile-landscape': {'max': '767px', 'orientation': 'landscape'},
        'tablet-portrait': {'min': '768px', 'max': '1023px', 'orientation': 'portrait'},
        'tablet-landscape': {'min': '768px', 'max': '1023px', 'orientation': 'landscape'},
      },
      
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        secondary: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fbd7a5',
          300: '#f8ba6d',
          400: '#f49332',
          500: '#f1750a',
          600: '#e25a00',
          700: '#bb4204',
          800: '#95340b',
          900: '#792b0c'
        },
        japanese: {
          red: '#e60012',
          gold: '#f6c00f',
          indigo: '#4b0082',
          sakura: '#ffb7c5',
          white: '#ffffff',
          black: '#1a1a1a',
          gray: '#f5f5f5'
        },
        // 映像工房品牌色彩
        'eizo-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#e60033',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'eizo-pink': {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#ff6b7a',
          600: '#ec4899',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        'eizo-gray': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
        japanese: ['Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'sans-serif']
      },
      fontSize: {
        '2xs': '0.625rem',
        '3xs': '0.5rem',
        // 响应式字体大小
        'xs-mobile': ['0.75rem', { lineHeight: '1rem' }],
        'sm-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl-mobile': ['1.5rem', { lineHeight: '2rem' }],
        '3xl-mobile': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        // 响应式间距
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      
      // 响应式最小高度
      minHeight: {
        'touch': '44px', // 触摸友好的最小高度
        'button': '44px',
        'input': '44px',
        'card': '60px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // 移动端动画
        'fade-in-mobile': 'fadeIn 0.3s ease-in-out',
        'fade-out-mobile': 'fadeOut 0.3s ease-in-out',
        'slide-in-mobile': 'slideIn 0.3s ease-in-out',
        'slide-out-mobile': 'slideOut 0.3s ease-in-out',
        'drawer-in': 'drawerIn 0.3s ease-in-out',
        'drawer-out': 'drawerOut 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' }
        },
        drawerIn: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        drawerOut: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' }
        }
      },
      boxShadow: {
        'japanese': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'japanese-hover': '0 8px 30px rgba(0, 0, 0, 0.15)',
        // 响应式阴影
        'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'tablet': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'desktop': '0 8px 24px rgba(0, 0, 0, 0.1)',
        'mobile-elevated': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'tablet-elevated': '0 8px 20px rgba(0, 0, 0, 0.15)',
        'desktop-elevated': '0 12px 32px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'japanese': '8px',
        // 响应式边框圆角
        'mobile': '12px',
        'tablet': '16px',
        'desktop': '16px',
      },
      
      // 背景渐变
      backgroundImage: {
        'eizo-gradient': 'linear-gradient(135deg, #e60033, #ff6b7a)',
        'eizo-gradient-dark': 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // 自定义插件：响应式工具类
    function({ addUtilities }) {
      const newUtilities = {
        '.touch-manipulation': {
          'touch-action': 'manipulation',
        },
        '.touch-none': {
          'touch-action': 'none',
        },
        '.touch-pan-x': {
          'touch-action': 'pan-x',
        },
        '.touch-pan-y': {
          'touch-action': 'pan-y',
        },
        '.scroll-touch': {
          '-webkit-overflow-scrolling': 'touch',
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.safe-area-inset-top': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.safe-area-inset-bottom': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.mobile-container': {
          'max-width': '100%',
          'margin': '0 auto',
          'padding': '16px',
        },
        '.tablet-container': {
          'max-width': '768px',
          'margin': '0 auto',
          'padding': '24px',
        },
        '.desktop-container': {
          'max-width': '1200px',
          'margin': '0 auto',
          'padding': '32px',
        },
        '.eizo-button': {
          'background': 'linear-gradient(135deg, #e60033, #ff6b7a)',
          'color': '#ffffff',
          'border': 'none',
          'border-radius': '8px',
          'padding': '12px 24px',
          'font-weight': '500',
          'transition': 'all 0.3s ease',
          'cursor': 'pointer',
          'min-height': '44px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
        },
        '.eizo-button:hover': {
          'transform': 'translateY(-2px)',
          'box-shadow': '0 8px 20px rgba(230, 0, 51, 0.3)',
        },
        '.eizo-card': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'border-radius': '16px',
          'padding': '24px',
          'backdrop-filter': 'blur(10px)',
        },
        '.eizo-input': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'border-radius': '8px',
          'padding': '12px 16px',
          'color': '#ffffff',
          'font-size': '16px',
          'min-height': '44px',
        },
        '.eizo-input:focus': {
          'outline': 'none',
          'border-color': '#e60033',
          'box-shadow': '0 0 0 2px rgba(230, 0, 51, 0.2)',
        },
      };
      
      addUtilities(newUtilities);
    },
  ]
}; 