import Pusher from 'pusher'

// Server-side Pusher client. Ensure you set envs in .env.local
// PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER

let pusher: Pusher | null = null

export function getPusher() {
  if (!pusher) {
    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      throw new Error('Pusher env vars missing. Please set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER')
    }
    pusher = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    })
  }
  return pusher
}

export async function triggerUserEvent(userId: string, event: string, payload: any) {
  const client = getPusher()
  const channel = `user:${userId}`
  await client.trigger(channel, event, payload)
}

export async function triggerConversationEvent(conversationId: string, event: string, payload: any) {
  const client = getPusher()
  const channel = `conversation:${conversationId}`
  await client.trigger(channel, event, payload)
}
