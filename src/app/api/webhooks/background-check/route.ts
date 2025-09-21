import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    if (payload.type === 'report.completed') {
      const checkId = payload.data.object.id;
      const result = payload.data.object.status; // 'clear' or 'consider'

      console.log(`[Webhook] Received background check result for ${checkId}: ${result}`);

      // Find the user with this checkId
      const users = await prisma.user.findMany();
      const userToUpdate = users.find(user => {
        if (!user.verificationData) return false;
        const data = JSON.parse(user.verificationData);
        return data.background?.checkId === checkId;
      });

      if (userToUpdate) {
        const verificationData = JSON.parse(userToUpdate.verificationData!);
        const isClear = result === 'clear';

        verificationData.background = {
          ...verificationData.background,
          status: isClear ? 'approved' : 'rejected',
          result: result,
          completedAt: new Date().toISOString(),
        };

        await prisma.user.update({
          where: { id: userToUpdate.id },
          data: {
            verificationData: JSON.stringify(verificationData),
            backgroundVerified: isClear,
          },
        });

        console.log(`[Webhook] User ${userToUpdate.email} background check status updated to ${result}.`);
      } else {
        console.warn(`[Webhook] Could not find user for check ID: ${checkId}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook] Error processing background check webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
