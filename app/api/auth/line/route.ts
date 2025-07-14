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
    const { code } = body;

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