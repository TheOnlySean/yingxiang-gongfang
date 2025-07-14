import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { dbAdmin } from '@/lib/database';
import { sendPurchaseThankYouEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Payment successful:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          metadata: session.metadata
        });

        // 更新用户积分
        if (session.metadata && session.payment_status === 'paid') {
          const { packageId, credits, userId } = session.metadata;
          
          // 检查必要字段是否存在
          if (!packageId || !credits || !userId) {
            console.error('Missing required metadata fields:', { packageId, credits, userId });
            break;
          }
          
          try {
            // 实际更新用户积分
            const creditsToAdd = parseInt(credits);
            console.log(`Adding ${creditsToAdd} credits to user ${userId} for package ${packageId}`);
            
            // 获取当前用户信息
            const currentUser = await dbAdmin.findById(userId);
            if (currentUser) {
              // 添加积分
              const success = await dbAdmin.addCredits(userId, creditsToAdd);
              
              if (success) {
                console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
                
                // 发送购买感谢邮件
                try {
                  // 套餐名称映射
                  const packageNames = {
                    'starter': 'スタータープラン',
                    'standard': 'スタンダードプラン',
                    'premium': 'プレミアムプラン'
                  };
                  
                  const packageName = packageNames[packageId as keyof typeof packageNames] || 'プラン';
                  
                  // 构建购买详情
                  const purchaseDetails = {
                    packageName,
                    credits: creditsToAdd,
                    amount: session.amount_total || 0, // 日元不需要除以100
                    sessionId: session.id,
                    purchaseDate: new Date().toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Tokyo'
                    })
                  };
                  
                  // 发送感谢邮件
                  const emailSent = await sendPurchaseThankYouEmail(
                    currentUser.email,
                    currentUser.displayName,
                    purchaseDetails
                  );
                  
                  if (emailSent) {
                    console.log(`Purchase thank you email sent to ${currentUser.email}`);
                  } else {
                    console.error(`Failed to send purchase thank you email to ${currentUser.email}`);
                  }
                  
                } catch (emailError) {
                  console.error('Error sending purchase thank you email:', emailError);
                }
                
                // 可以在这里添加支付记录到数据库
                // await dbAdmin.createPaymentRecord({
                //   userId,
                //   packageId,
                //   credits: creditsToAdd,
                //   amount: session.amount_total,
                //   sessionId: session.id,
                //   status: 'completed'
                // });
                
              } else {
                console.error(`Failed to add credits to user ${userId}`);
              }
            } else {
              console.error(`User ${userId} not found`);
            }
          } catch (error) {
            console.error('Error updating user credits:', error);
          }
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}
