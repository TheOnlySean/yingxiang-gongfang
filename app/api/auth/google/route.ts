import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { dbAdmin, dbUserToUser } from '@/lib/database';
import { generateToken } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';
import { IApiResponse } from '@/types';

// Google OAuth客户端配置
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
);

// GET: 获取Google OAuth授权URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'login' 或 'link'

    // 生成Google OAuth授权URL
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      state: type || 'login', // 传递状态参数
    });

    return NextResponse.json({
      success: true,
      data: { authUrl }
    } as IApiResponse);

  } catch (error) {
    console.error('Google OAuth URL generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to generate Google OAuth URL'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// POST: 处理Google OAuth回调
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

    console.log('Processing Google OAuth with code:', code.substring(0, 10) + '...');

    // 使用授权码获取访问令牌
    let tokens;
    try {
      const tokenResponse = await googleClient.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('Successfully obtained tokens from Google');
    } catch (tokenError: any) {
      console.error('Google token exchange error:', {
        error: tokenError.message,
        status: tokenError.status,
        code: tokenError.code
      });

      // 特殊处理invalid_grant错误
      if (tokenError.message?.includes('invalid_grant')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_GRANT',
              message: 'invalid_grant'
            }
          } as IApiResponse,
          { status: 400 }
        );
      }

      throw tokenError;
    }

    googleClient.setCredentials(tokens);

    // 获取用户信息
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID is not configured');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Failed to get user payload from Google');
    }

    const googleId = payload.sub;
    const email = payload.email;
    const displayName = payload.name;
    const avatarUrl = payload.picture;

    console.log('Google user info obtained:', { 
      googleId: googleId.substring(0, 10) + '...', 
      email: email?.substring(0, 3) + '***',
      displayName
    });

    // 检查用户是否已存在（通过Google ID）
    let existingUser = await dbAdmin.getUserByGoogleId(googleId);
    
    if (existingUser) {
      // 用户已存在，直接登录
      console.log('Existing Google user found, logging in');
      const user = dbUserToUser(existingUser);
      const token = generateToken(user);

      return NextResponse.json({
        success: true,
        data: {
          user,
          token,
          isNewUser: false
        },
        message: 'Google login successful'
      } as IApiResponse);
    }

    // 检查是否有同邮箱的邮箱用户
    if (email) {
      const emailUser = await dbAdmin.getUserByEmail(email);
      if (emailUser) {
        // 将Google账户链接到现有邮箱用户
        console.log('Linking Google account to existing email user');
        const linkData: any = { google_id: googleId };
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
            message: 'Google account linked and login successful'
          } as IApiResponse);
        }
      }
    }

    // 创建新用户
    console.log('Creating new Google user');
    const newUserData: any = {
      google_id: googleId,
      auth_provider: 'google',
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

    console.log('Google OAuth registration successful');
    return NextResponse.json({
      success: true,
      data: {
        user,
        token,
        isNewUser: true
      },
      message: 'Google registration and login successful! Welcome to 映像工房!'
    } as IApiResponse, { status: 201 });

  } catch (error: any) {
    console.error('Google OAuth callback error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Google OAuth authentication failed'
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