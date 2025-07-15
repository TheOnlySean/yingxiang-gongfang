import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test webhook received:', body);

    // 模拟一个成功的支付事件
    const { userId, credits } = body;
    
    if (!userId || !credits) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing userId or credits' 
      }, { status: 400 });
    }

    // 获取用户当前信息
    const user = await dbAdmin.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log('User before update:', {
      id: user.id,
      email: user.email,
      credits: user.credits
    });

    // 尝试添加积分
    const success = await dbAdmin.addCredits(userId, parseInt(credits));
    
    if (success) {
      // 重新获取用户信息验证更新
      const updatedUser = await dbAdmin.findById(userId);
      console.log('User after update:', {
        id: updatedUser?.id,
        email: updatedUser?.email,
        credits: updatedUser?.credits
      });

      return NextResponse.json({
        success: true,
        message: 'Credits added successfully',
        data: {
          userId,
          creditsAdded: parseInt(credits),
          oldCredits: user.credits,
          newCredits: updatedUser?.credits
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to add credits to database' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is working',
    usage: 'POST with { userId: string, credits: number }'
  });
} 