import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // 从Stripe获取session信息
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product']
    });

    // 格式化返回数据
    const sessionData = {
      id: session.id,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
      line_items: session.line_items?.data.map(item => ({
        quantity: item.quantity,
        price: {
          unit_amount: item.price?.unit_amount,
          currency: item.price?.currency
        },
        product: {
          name: typeof item.price?.product === 'object' && 'name' in item.price.product ? item.price.product.name : null,
          description: typeof item.price?.product === 'object' && 'description' in item.price.product ? item.price.product.description : null
        }
      }))
    };

    return NextResponse.json(sessionData);

  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session information' },
      { status: 500 }
    );
  }
} 