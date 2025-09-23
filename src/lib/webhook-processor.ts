import { prisma } from './prisma';

interface WebhookData {
  type: string;
  data?: {
    object?: {
      id?: string;
      status?: string;
    };
  };
  userId?: string;
}

export async function processWebhook(event: string, data: Record<string, unknown>): Promise<void> {
  const webhookData = data as unknown as WebhookData;
  
  if (webhookData.type === 'report.completed') {
    const checkId = webhookData.data?.object?.id;
    const result = webhookData.data?.object?.status; // 'clear' or 'consider'

    if (!checkId || !result) {
      console.warn('[WebhookProcessor] Missing checkId or result in webhook data');
      return;
    }

    console.log(`[WebhookProcessor] Processing background check result for ${checkId}: ${result}`);

    // If a userId is passed directly (from our mock service), use it for a guaranteed lookup.
    // Otherwise, fall back to the checkId search for real webhooks.
    const userToUpdate = webhookData.userId
      ? await prisma.user.findUnique({ where: { id: webhookData.userId } })
      : await prisma.user.findFirst({
          where: {
            verificationData: {
              contains: `"checkId":"${checkId}"`,
            },
          },
        });

    if (userToUpdate) {
      const verificationData = JSON.parse(userToUpdate.verificationData || '{}');
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

      console.log(`[WebhookProcessor] User ${userToUpdate.email} background check status updated to ${result}.`);
    } else {
      console.warn(`[WebhookProcessor] Could not find user for check ID: ${checkId}`);
    }
  } else {
    console.log(`[WebhookProcessor] Received webhook of type ${webhookData.type}, ignoring.`);
  }
}
