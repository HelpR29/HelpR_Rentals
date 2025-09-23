import { NextRequest, NextResponse } from 'next/server';
import { processWebhook } from '@/lib/webhook-processor';

// This endpoint simulates receiving a webhook from a third-party background check provider.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // In a real application, you would first verify the webhook signature
    // to ensure it's coming from the trusted provider.
    // const signature = request.headers.get('Checkr-Signature');
    // if (!verifySignature(signature, payload)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    await processWebhook('background-check', payload);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing background check webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
