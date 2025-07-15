import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { dbAdmin } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticate(request);
    if (!authResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { amount, targetEmail } = body;

    // 验证充值金额
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid amount'
        }
      }, { status: 400 });
    }

    // 确定目标用户（如果有指定email则充值给指定用户，否则充值给当前用户）
    const targetUser = targetEmail 
      ? await dbAdmin.getUserByEmail(targetEmail)
      : authResult.user;

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Target user not found'
        }
      }, { status: 404 });
    }

    console.log(`Adding ${amount} credits to user ${targetUser.email}`);

    // 获取用户当前的credits
    const currentCredits = targetUser.credits || 0;
    const newCredits = currentCredits + amount;

    // 更新用户credits
    const updatedUser = await dbAdmin.update(targetUser.id, {
      credits: newCredits
    });

    if (updatedUser) {
      console.log(`Successfully added ${amount} credits to ${targetUser.email}. New balance: ${newCredits}`);
      
      return NextResponse.json({
        success: true,
        data: {
          message: `Successfully added ${amount} credits`,
          user: {
            email: updatedUser.email,
            credits: updatedUser.credits,
            creditsAdded: amount
          }
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update user credits'
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Add credits API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Internal server error'
        }
      },
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 