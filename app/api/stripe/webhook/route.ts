import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { dbAdmin } from '@/lib/database';
import { sendPurchaseThankYouEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function POST(request: NextRequest) {
  console.log('=== STRIPE WEBHOOK CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('STRIPE_WEBHOOK_SECRET present:', !!process.env.STRIPE_WEBHOOK_SECRET);
  console.log('STRIPE_WEBHOOK_SECRET length:', process.env.STRIPE_WEBHOOK_SECRET?.length);
  
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    console.log('Webhook body length:', body.length);
    console.log('Signature present:', !!signature);
    console.log('Signature value:', signature);

    if (!signature) {
      console.error('No Stripe signature found');
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
      console.log('✅ Webhook signature verified successfully');
      console.log('Event type:', event.type);
      console.log('Event id:', event.id);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      console.error('Error details:', err instanceof Error ? err.message : 'Unknown error');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 处理不同的事件类型
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('🎉 Processing checkout.session.completed event');
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Session details:', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
          amount_total: session.amount_total,
          customer_email: session.customer_details?.email
        });

        // 更新用户积分
        if (session.metadata && session.payment_status === 'paid') {
          const { packageId, credits, userId } = session.metadata;
          
          console.log('Metadata extracted:', { packageId, credits, userId });
          
          // 检查必要字段是否存在
          if (!packageId || !credits || !userId) {
            console.error('❌ Missing required metadata fields:', { packageId, credits, userId });
            break;
          }
          
          try {
            // 实际更新用户积分
            const creditsToAdd = parseInt(credits);
            console.log(`🔄 Attempting to add ${creditsToAdd} credits to user ${userId}`);
            
            // 获取当前用户信息
            const currentUser = await dbAdmin.findById(userId);
            if (!currentUser) {
              console.error('❌ User not found:', userId);
              break;
            }
            
            console.log('📊 User before update:', {
              id: currentUser.id,
              email: currentUser.email,
              credits: currentUser.credits
            });
            
            // 添加积分
            const success = await dbAdmin.addCredits(userId, creditsToAdd);
            
            if (success) {
              console.log('✅ Credits added successfully');
              
              // 验证更新
              const updatedUser = await dbAdmin.findById(userId);
              console.log('📊 User after update:', {
                id: updatedUser?.id,
                email: updatedUser?.email,
                credits: updatedUser?.credits
              });
              
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
                  amount: session.amount_total || 0,
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
                
                console.log('📧 Sending purchase thank you email...');
                const emailSent = await sendPurchaseThankYouEmail(
                  currentUser.email,
                  currentUser.displayName,
                  purchaseDetails
                );
                
                if (emailSent) {
                  console.log('✅ Purchase thank you email sent successfully');
                } else {
                  console.error('❌ Failed to send purchase thank you email');
                }
                
              } catch (emailError) {
                console.error('❌ Error sending purchase thank you email:', emailError);
              }
              
            } else {
              console.error('❌ Failed to add credits to user database');
            }
            
          } catch (error) {
            console.error('❌ Error updating user credits:', error);
          }
        } else {
          console.log('⚠️ Skipping credit update - payment not completed or missing metadata');
        }
        break;

      case 'payment_intent.succeeded':
        console.log('✅ Payment intent succeeded:', event.data.object);
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment intent failed:', event.data.object);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    console.log('✅ Webhook processing completed successfully');
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    );
  }
}
