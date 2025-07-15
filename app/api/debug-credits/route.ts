import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { dbAdmin } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 获取用户当前信息
    const user = await dbAdmin.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      currentCredits: user.credits,
      totalUsed: user.totalUsed,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Debug credits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 