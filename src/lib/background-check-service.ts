import { prisma } from './prisma';

// This is a mock service that simulates a third-party background check provider like Checkr.
// In a real application, this would make API calls to the provider.

const MOCK_API_DELAY = 15000; // 15 seconds to simulate the time a real check takes

class BackgroundCheckService {
  async initiateCheck(userId: string): Promise<{ status: string; checkId: string }> {
    console.log(`[BackgroundCheckService] Initiating background check for user: ${userId}`);

    // 1. In a real app, you would first create a 'candidate' with the provider's API.
    // const candidate = await checkr.candidates.create({ ... });

    // 2. Then, you would create a 'report' for that candidate.
    // const report = await checkr.reports.create({ candidate_id: candidate.id, ... });
    const mockCheckId = `check_${Date.now()}`;

    // 3. Update our database to show the check is in progress.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.verificationData) {
      const verificationData = JSON.parse(user.verificationData);
      verificationData.background = {
        ...verificationData.background,
        status: 'pending',
        checkId: mockCheckId,
        submittedAt: new Date().toISOString(),
      };
      await prisma.user.update({
        where: { id: userId },
        data: { verificationData: JSON.stringify(verificationData) },
      });
    }

    // 4. Simulate the webhook callback after a delay.
    setTimeout(() => {
      this.simulateWebhookCallback(userId, mockCheckId);
    }, MOCK_API_DELAY);

    console.log(`[BackgroundCheckService] Check initiated. Mock ID: ${mockCheckId}`);
    return { status: 'pending', checkId: mockCheckId };
  }

  private async simulateWebhookCallback(userId: string, checkId: string) {
    const results = ['clear', 'consider'];
    const randomResult = results[Math.floor(Math.random() * results.length)];

    const payload = {
      type: 'report.completed',
      data: {
        object: {
          id: checkId,
          status: randomResult, // 'clear' or 'consider'
          adjudication: 'engaged',
        },
      },
    };

    console.log(`[BackgroundCheckService] Simulating webhook for check ${checkId} with result: ${randomResult}`);

    try {
      const host = process.env.NEXTAUTH_URL || 'http://localhost:3010';
      await fetch(`${host}/api/webhooks/background-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[BackgroundCheckService] Error simulating webhook:', error);
    }
  }
}

export const backgroundCheckService = new BackgroundCheckService();
