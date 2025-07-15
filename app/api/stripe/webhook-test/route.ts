import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('=== WEBHOOK TEST ENDPOINT CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('Request headers:', headers);
    console.log('Request body length:', body.length);
    console.log('Request body (first 500 chars):', body.substring(0, 500));
    
    // 尝试解析为JSON
    try {
      const jsonBody = JSON.parse(body);
      console.log('Parsed event type:', jsonBody.type);
      console.log('Parsed event id:', jsonBody.id);
    } catch (e) {
      console.log('Failed to parse body as JSON:', e);
    }
    
    return NextResponse.json({ 
      received: true, 
      message: 'Webhook test received successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ 
      error: 'Webhook test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook test endpoint is working',
    endpoint: '/api/stripe/webhook-test'
  });
} 