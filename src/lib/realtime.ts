import Pusher from 'pusher'

// Server-side Pusher client. Ensure you set envs in .env.local
// PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER

let pusher: Pusher | null = null

export function getPusher() {
  if (!pusher) {
    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      console.warn('Pusher env vars missing. Realtime features disabled.')
      return null
    }
    try {
      pusher = new Pusher({
        appId: PUSHER_APP_ID,
        key: PUSHER_KEY,
        secret: PUSHER_SECRET,
        cluster: PUSHER_CLUSTER,
        useTLS: true,
      })
    } catch (error) {
      console.error('Failed to initialize Pusher:', error)
      return null
    }
  }
  return pusher
}

export async function triggerUserEvent(userId: string, event: string, payload: any) {
  const client = getPusher()
  if (!client) {
    console.log('Pusher not available, skipping user event:', event)
    return
  }
  const channel = `user:${userId}`
  await client.trigger(channel, event, payload)
}

export async function triggerConversationEvent(conversationId: string, event: string, payload: any) {
  const client = getPusher()
  if (!client) {
    console.log('Pusher not available, skipping conversation event:', event)
    return
  }
  const channel = `conversation:${conversationId}`
  await client.trigger(channel, event, payload)
}
