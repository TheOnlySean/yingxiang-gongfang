import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePassword, createRateLimiter } from '@/lib/auth';
import { createDbConnection } from '@/lib/database';
import { IApiResponse } from '@/types';

// 重设密码请求的速率限制：每个IP每小时最多10次请求
const resetPasswordRateLimiter = createRateLimiter(10, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // 获取客户端IP地址用于速率限制
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // 检查速率限制
    if (!resetPasswordRateLimiter(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many password reset attempts. Please try again later.'
          }
        } as IApiResponse,
        { status: 429 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    // 验证必填字段
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token, password, and confirm password are required'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Passwords do not match'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Password does not meet requirements',
            details: {
              errors: passwordValidation.errors
            }
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 查找具有有效重置令牌的用户
    const user = await findUserByResetToken(token);
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired reset token'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 检查令牌是否过期
    const now = new Date();
    const tokenExpiry = new Date(user.passwordResetExpiresAt);
    
    if (now > tokenExpiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Reset token has expired'
          }
        } as IApiResponse,
        { status: 400 }
      );
    }

    // 加密新密码
    const passwordHash = await hashPassword(password);

    // 更新用户密码并清除重置令牌
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        UPDATE users SET 
          password_hash = $1,
          password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [passwordHash, user.id]);
      
      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to reset password'
            }
          } as IApiResponse,
          { status: 500 }
        );
      }
      
    } finally {
      await client.end();
    }



    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Password has been reset successfully'
        }
      } as IApiResponse,
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      } as IApiResponse,
      { status: 500 }
    );
  }
}

// 通过重置令牌查找用户的辅助函数
async function findUserByResetToken(token: string) {
  try {
    // 由于没有直接的查询方法，我们需要通过SQL查询
    // 这里使用一个临时的方法，实际应该在DatabaseAdmin类中添加这个方法
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const query = `
      SELECT id, email, password_reset_token, password_reset_expires_at 
      FROM users 
      WHERE password_reset_token = $1 AND password_reset_expires_at > NOW()
    `;
    
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by reset token:', error);
    return null;
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 