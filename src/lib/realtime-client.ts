import PusherClient from 'pusher-js'

let client: PusherClient | null = null

export function getPusherClient() {
  if (client) return client
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'mt1'
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_PUSHER_KEY (or PUSHER_KEY) for client realtime')
  }
  client = new PusherClient(key, {
    cluster,
    forceTLS: true,
  })
  return client
}
