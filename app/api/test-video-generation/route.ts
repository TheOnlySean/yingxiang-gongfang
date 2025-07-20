import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { generateVideo } from '@/lib/video-generation';
import { IApiResponse, IVideoGenerationForm } from '@/types';

export async function POST(request: NextRequest) {
  try {
    let user = null;
    
    // 使用真实认证
    const authResult = await authenticate(request);
    user = authResult.user;
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: authResult.error || 'Authentication required'
          }
        } as IApiResponse,
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { testType = 'success' } = body;

    // 构建测试表单数据
    const form: IVideoGenerationForm = {
      originalPrompt: testType === 'failure' ? 'unsafe content test' : 'テスト用プロンプト',
      imageUrls: []
    };

    console.log(`Testing video generation with type: ${testType}`);

    if (testType === 'failure') {
      // 模拟失败情况：使用会导致400错误的prompt
      const result = await generateVideo(user.id, form);
      
      return NextResponse.json({
        success: true,
        message: 'Test completed',
        result: result,
        testType: testType
      });
    } else {
      // 正常生成
      const result = await generateVideo(user.id, form);
      
      return NextResponse.json({
        success: true,
        message: 'Test completed',
        result: result,
        testType: testType
      });
    }

  } catch (error) {
    console.error('Test video generation API error:', error);
    
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