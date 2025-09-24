import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const users = [
      { email: 'tenant@test.com', role: 'tenant' },
      { email: 'host@test.com', role: 'host' },
      { email: 'admin@test.com', role: 'admin' },
      { email: 'tenant2@test.com', role: 'tenant' },
      { email: 'host2@test.com', role: 'host' }
    ]

    const baseUrl = request.nextUrl.origin
    const links = users.map(user => {
      const token = generateMagicToken(user.email)
      const url = `${baseUrl}/api/auth/callback?token=${token}&role=${user.role}`
      return {
        email: user.email,
        role: user.role,
        url
      }
    })

    // Return HTML page with clickable links
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Magic Links for Testing</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .link-card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9f9f9; }
        .email { font-weight: bold; color: #333; font-size: 18px; }
        .role { color: #666; text-transform: capitalize; margin: 5px 0; }
        .url { word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #eee; }
        a { color: #3B82F6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .note { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔗 Magic Links for Testing Chat System</h1>
        <p>Click any link below to login and test the inbox</p>
      </div>
      
      <div class="note">
        <strong>⏰ Note:</strong> These links expire in 15 minutes. After login, go to <strong>/inbox</strong> to test the chat system.
      </div>
      
      ${links.map(link => `
        <div class="link-card">
          <div class="email">${link.email.toUpperCase()}</div>
          <div class="role">Role: ${link.role}</div>
          <div class="url">
            <a href="${link.url}" target="_blank">${link.url}</a>
          </div>
        </div>
      `).join('')}
      
      <div class="note">
        <strong>🧪 Testing Instructions:</strong>
        <ol>
          <li>Click a magic link to login</li>
          <li>Go to <strong>/inbox</strong></li>
          <li>Open another browser/incognito window</li>
          <li>Login as a different user</li>
          <li>Send messages and test real-time chat!</li>
        </ol>
      </div>
    </body>
    </html>
    `

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Generate links error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
