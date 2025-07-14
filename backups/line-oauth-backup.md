# LINE OAuth 代码备份

> 此文件包含完整的LINE OAuth实现代码，待部署到Vercel后恢复使用

## 1. API路由: app/api/auth/line/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, dbUserToUser } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

// Line OAuth配置
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const LINE_CALLBACK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/line/callback`;

// GET: 获取Line OAuth授权URL
export async function GET(request: NextRequest) {
  try {
    if (!LINE_CHANNEL_ID) {
      throw new Error('Line Channel ID is not configured');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'login';

    // 生成随机state参数
    const state = Buffer.from(JSON.stringify({ type, timestamp: Date.now() })).toString('base64');

    // 构建Line OAuth授权URL
    const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', LINE_CHANNEL_ID);
    authUrl.searchParams.set('redirect_uri', LINE_CALLBACK_URL);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'profile openid email');

    return NextResponse.json({
      success: true,
      data: { authUrl: authUrl.toString() }
    } as IApiResponse);

  } catch (error) {
    console.error('Line OAuth URL generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate Line OAuth URL'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// POST: 处理Line OAuth回调
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Authorization code is required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
      throw new Error('Line OAuth credentials are not configured');
    }

    // 获取访问令牌
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: LINE_CALLBACK_URL,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token from Line');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 获取用户信息
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get user profile from Line');
    }

    const profile = await profileResponse.json();
    const lineId = profile.userId;
    const displayName = profile.displayName;
    const avatarUrl = profile.pictureUrl;

    // 尝试获取邮箱（需要email scope，但不是所有用户都有）
    let email = null;
    try {
      // 解析ID token获取邮箱（如果有的话）
      if (tokenData.id_token) {
        const idTokenPayload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
        email = idTokenPayload.email;
      }
    } catch (error) {
      console.log('No email available from Line OAuth');
    }

    // 检查用户是否已存在（通过Line ID）
    let existingUser = await dbAdmin.getUserByLineId(lineId);
    
    if (existingUser) {
      // 用户已存在，直接登录
      const user = dbUserToUser(existingUser);
      const token = generateToken(user);

      return NextResponse.json({
        success: true,
        data: {
          user,
          token,
          isNewUser: false
        },
        message: 'Line login successful'
      } as IApiResponse);
    }

    // 检查是否有同邮箱的邮箱用户（如果有邮箱的话）
    if (email) {
      const emailUser = await dbAdmin.getUserByEmail(email);
      if (emailUser) {
        // 将Line账户链接到现有邮箱用户
        const linkData: any = { line_id: lineId };
        if (avatarUrl) linkData.avatar_url = avatarUrl;
        if (displayName) linkData.display_name = displayName;
        
        const updatedUser = await dbAdmin.linkOAuthAccount(emailUser.id, linkData);

        if (updatedUser) {
          const user = dbUserToUser(updatedUser);
          const token = generateToken(user);

          return NextResponse.json({
            success: true,
            data: {
              user,
              token,
              isNewUser: false
            },
            message: 'Line account linked and login successful'
          } as IApiResponse);
        }
      }
    }

    // 创建新用户
    const newUserData: any = {
      line_id: lineId,
      auth_provider: 'line',
      credits: 100
    };
    
    if (email) newUserData.email = email;
    if (displayName) newUserData.display_name = displayName;
    if (avatarUrl) newUserData.avatar_url = avatarUrl;

    const dbUser = await dbAdmin.createOAuthUser(newUserData);
    const user = dbUserToUser(dbUser);
    const token = generateToken(user);

    // 发送欢迎邮件（如果有邮箱）
    if (email) {
      try {
        await sendWelcomeEmail(email, displayName || email.split('@')[0]);
        console.log('Welcome email sent successfully to:', email);
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // 邮件发送失败不影响注册流程
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
        isNewUser: true
      },
      message: 'Line registration and login successful! Welcome to 映像工房!'
    } as IApiResponse, { status: 201 });

  } catch (error) {
    console.error('Line OAuth callback error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Line OAuth authentication failed'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
```

## 2. 回调页面: app/auth/line/callback/page.tsx

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function LineCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 获取URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          setStatus('error');
          setErrorMessage('LINE認証がキャンセルされました');
          return;
        }

        if (!code) {
          setStatus('error');
          setErrorMessage('認証コードが見つかりません');
          return;
        }

        // 发送回调到后端
        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // 保存token
            localStorage.setItem('token', result.data.token);
            
            setStatus('success');
            message.success('LINE認証に成功しました！');
            
            // 2秒后重定向到主页
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            setStatus('error');
            setErrorMessage(result.error?.message || 'LINE認証に失敗しました');
          }
        } else {
          setStatus('error');
          setErrorMessage('サーバーエラーが発生しました');
        }
      } catch (error) {
        console.error('Line callback error:', error);
        setStatus('error');
        setErrorMessage('認証処理中にエラーが発生しました');
      }
    };

    handleCallback();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '50px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: 400,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px'
        }}>
          {status === 'loading' && (
            <>
              <Spin size="large" style={{ color: '#00B900' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                LINE認証を処理中...
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                しばらくお待ちください
              </Text>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                認証成功！
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                映像工房へリダイレクトしています...
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <CloseCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f' }} />
              <Title level={3} style={{ color: '#ffffff', marginTop: '16px' }}>
                認証エラー
              </Title>
              <Text style={{ color: '#a0a0a0' }}>
                {errorMessage}
              </Text>
              <div style={{ marginTop: '24px' }}>
                <a 
                  href="/" 
                  style={{ 
                    color: '#1890ff',
                    textDecoration: 'underline'
                  }}
                >
                  ホームページに戻る
                </a>
              </div>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
}
```

## 3. 数据库方法 (lib/database.ts)

```typescript
// Line用户查询
async getUserByLineId(lineId: string) {
  const query = 'SELECT * FROM users WHERE line_id = $1';
  const result = await pool.query(query, [lineId]);
  return result.rows[0] || null;
}

// 在createOAuthUser和linkOAuthAccount方法中支持line_id字段处理
```

## 4. 环境变量

```bash
# Line OAuth配置  
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
```

## 5. 前端组件 (WorkingPlayground.tsx)

```typescript
// Line OAuth登录处理
const handleLineLogin = async () => {
  setIsLoading(true);
  try {
    // 获取Line OAuth授权URL
    const response = await fetch('/api/auth/line', {
      method: 'GET',
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // 重定向到Line授权页面
        window.location.href = result.data.authUrl;
      } else {
        message.error('LINE OAuth設定エラー');
      }
    } else {
      message.error('LINE OAuth接続に失敗しました');
    }
  } catch (error) {
    console.error('Line OAuth error:', error);
    message.error('LINE OAuth処理中にエラーが発生しました');
  } finally {
    setIsLoading(false);
  }
};

// Line登录按钮
<Button
  type="default"
  onClick={handleLineLogin}
  loading={isLoading}
  style={{
    width: '100%',
    height: '48px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  }}
  icon={
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
      <path fill="#00B900" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  }
>
  LINEでログイン
</Button>
```

## 恢复说明

部署到Vercel后，需要：
1. 在Line Developers中更新Callback URL为实际域名
2. 提交Privacy Policy和Terms of Use
3. 恢复上述代码
4. 更新环境变量中的LINE配置

备份完成时间：2025-01-14 