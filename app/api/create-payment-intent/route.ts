import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authenticate } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// 套餐配置
const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'スタータープラン',
    credits: 1000,
    price: 750,
    description: '初心者向けの基本プラン - AI動画生成に最適',
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&crop=center'
  },
  standard: {
    id: 'standard', 
    name: 'スタンダードプラン',
    credits: 10000,
    price: 7500,
    description: '人気のお得なプラン - 動画制作に最適',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop&crop=center'
  },
  premium: {
    id: 'premium',
    name: 'プレミアムプラン', 
    credits: 100000,
    price: 70000,
    description: 'プロフェッショナル向け最上位プラン - 大量制作に最適',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop&crop=center'
  }
};

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await authenticate(request);
    
    if (!authResult.user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { packageId } = await request.json();
    
    if (!packageId || !CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json(
        { error: '無効なパッケージIDです' },
        { status: 400 }
      );
    }

    const selectedPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];

    // 创建Stripe Checkout会话
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: `映像工房：${selectedPackage.credits.toLocaleString()}ポイント購入`,
              description: `${selectedPackage.name} - ${selectedPackage.description}`,
              images: [selectedPackage.image],
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/purchase`,
      metadata: {
        packageId: packageId,
        credits: selectedPackage.credits.toString(),
        userId: authResult.user.id
      },
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: false
      },
      locale: 'ja'
    });

    return NextResponse.json({ clientSecret: session.id });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return NextResponse.json(
      { error: '支払い処理の初期化に失敗しました' },
      { status: 500 }
    );
  }
}
