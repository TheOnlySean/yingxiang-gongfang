import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { dbAdmin } from './supabase';
import { IUser, IApiResponse, API_ERROR_CODES } from '@/types';

// 环境变量
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

// JWT载荷接口
interface IJwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 生成JWT Token
export function generateToken(user: IUser): string {
  const payload: IJwtPayload = {
    userId: user.id,
    email: user.email
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

// 验证JWT Token
export function verifyToken(token: string): IJwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as IJwtPayload;
    return payload;
  } catch (error) {
    return null;
  }
}

// 从请求中提取Token
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

// 认证中间件
export async function authenticate(request: NextRequest): Promise<{
  user: IUser | null;
  error: string | null;
}> {
  const token = extractTokenFromRequest(request);
  
  if (!token) {
    return { user: null, error: 'No token provided' };
  }

  const payload = verifyToken(token);
  
  if (!payload) {
    return { user: null, error: 'Invalid token' };
  }

  try {
    // 验证用户是否存在且活跃
    const user = await dbAdmin.getUserById(payload.userId);
    
    if (!user || !user.is_active) {
      return { user: null, error: 'User not found or inactive' };
    }

    // 简化会话验证：直接使用token而不是hash
    // 在生产环境中可以考虑更安全的方式，但现在先让功能工作
    // TODO: 实现更安全的会话管理
    
    return {
      user: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        totalUsed: user.total_used,
        videosGenerated: user.videos_generated,
        isActive: user.is_active,
        plan: user.plan || 'free', // 默认为free计划
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      error: null
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

// 用户注册
export async function registerUser(
  email: string,
  password: string
): Promise<IApiResponse<{ user: IUser; token: string }>> {
  try {
    // 检查邮箱是否已存在
    const existingUser = await dbAdmin.getUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: 'Email already exists'
        }
      };
    }

    // 创建用户
    const hashedPassword = await hashPassword(password);
    const userData = {
      email,
      password_hash: hashedPassword,
      credits: 100, // 新用户免费点数
      total_used: 0,
      videos_generated: 0,
      is_active: true
    };

    const user = await dbAdmin.createUser(userData);
    
    // 生成Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      credits: user.credits,
      totalUsed: user.total_used,
      videosGenerated: user.videos_generated,
      isActive: user.is_active,
      plan: user.plan || 'free',
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

    // 暂时简化会话创建，专注于核心功能
    // TODO: 在生产环境中实现完整的会话管理

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          credits: user.credits,
          totalUsed: user.total_used,
          videosGenerated: user.videos_generated,
          isActive: user.is_active,
          plan: user.plan || 'free',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        token
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Registration failed'
      }
    };
  }
}

// 用户登录
export async function loginUser(
  email: string,
  password: string
): Promise<IApiResponse<{ user: IUser; token: string }>> {
  try {
    // 查找用户
    const user = await dbAdmin.getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials'
        }
      };
    }

    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials'
        }
      };
    }

    // 检查用户是否激活
    if (!user.is_active) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.FORBIDDEN,
          message: 'Account is inactive'
        }
      };
    }

    // 生成Token
    const token = generateToken({
      id: user.id,
      email: user.email,
      credits: user.credits,
      totalUsed: user.total_used,
      videosGenerated: user.videos_generated,
      isActive: user.is_active,
      plan: user.plan || 'free',
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

    // 暂时简化会话创建，专注于核心功能
    // TODO: 在生产环境中实现完整的会话管理

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          credits: user.credits,
          totalUsed: user.total_used,
          videosGenerated: user.videos_generated,
          isActive: user.is_active,
          plan: user.plan || 'free',
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        token
      }
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Login failed'
      }
    };
  }
}

// 用户登出
export async function logoutUser(token: string): Promise<IApiResponse<{}>> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token'
        }
      };
    }

    // 使会话失效
    const tokenHash = await bcrypt.hash(token, 10);
    const session = await dbAdmin.getSessionByTokenHash(tokenHash);
    
    if (session) {
      await dbAdmin.deleteSession(session.id);
    }

    return {
      success: true,
      data: {}
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Logout failed'
      }
    };
  }
}

// 获取用户信息
export async function getCurrentUser(token: string): Promise<IApiResponse<IUser>> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token'
        }
      };
    }

    const user = await dbAdmin.getUserById(payload.userId);
    if (!user || !user.is_active) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        credits: user.credits,
        totalUsed: user.total_used,
        videosGenerated: user.videos_generated,
        isActive: user.is_active,
        plan: user.plan || 'free',
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to get user'
      }
    };
  }
}

// 刷新Token
export async function refreshToken(token: string): Promise<IApiResponse<{ token: string }>> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid token'
        }
      };
    }

    const user = await dbAdmin.getUserById(payload.userId);
    if (!user || !user.is_active) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: 'User not found'
        }
      };
    }

    // 生成新Token
    const newToken = generateToken({
      id: user.id,
      email: user.email,
      credits: user.credits,
      totalUsed: user.total_used,
      videosGenerated: user.videos_generated,
      isActive: user.is_active,
      plan: user.plan || 'free',
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

    // 更新会话
    const oldTokenHash = await bcrypt.hash(token, 10);
    const session = await dbAdmin.getSessionByTokenHash(oldTokenHash);
    
    if (session) {
      const newTokenHash = await bcrypt.hash(newToken, 10);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await dbAdmin.updateSession(session.id, {
        token_hash: newTokenHash,
        expires_at: expiresAt.toISOString(),
        last_activity: new Date().toISOString()
      });
    }

    return {
      success: true,
      data: { token: newToken }
    };
  } catch (error) {
    console.error('Refresh token error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: 'Failed to refresh token'
      }
    };
  }
}

// 清理过期会话
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await dbAdmin.cleanupExpiredSessions();
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
  }
}

// 邮箱验证
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 密码验证
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 生成随机密码
export function generateRandomPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

// 速率限制器
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();

  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // 获取该标识符的请求记录
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }

    const userRequests = requests.get(identifier)!;

    // 移除过期的请求记录
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    requests.set(identifier, validRequests);

    // 检查是否超过限制
    if (validRequests.length >= maxRequests) {
      return false; // 超过限制
    }

    // 记录当前请求
    validRequests.push(now);
    
    return true; // 允许请求
  };
}

// 导出速率限制器实例
export const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 15分钟内最多5次登录尝试
export const registerRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 1小时内最多3次注册尝试 