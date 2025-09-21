import { prisma } from './prisma';

export async function processBackgroundCheckWebhook(payload: any) {
  if (payload.type === 'report.completed') {
    const checkId = payload.data.object.id;
    const result = payload.data.object.status; // 'clear' or 'consider'

    console.log(`[WebhookProcessor] Processing background check result for ${checkId}: ${result}`);

    // Use a more robust direct query with JSON filtering to find the user.
    // This is more efficient and resilient to state inconsistencies than fetching all users.
    const userToUpdate = await prisma.user.findFirst({
      where: {
        verificationData: {
          contains: `"checkId":"${checkId}"`
        }
      }
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

      console.log(`[WebhookProcessor] User ${userToUpdate.email} background check status updated to ${result}.`);
    } else {
      console.warn(`[WebhookProcessor] Could not find user for check ID: ${checkId}`);
    }
  } else {
    console.log(`[WebhookProcessor] Received webhook of type ${payload.type}, ignoring.`);
  }
}
