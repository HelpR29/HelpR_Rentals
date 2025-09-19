import sgMail from '@sendgrid/mail'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@helpr.app'

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export async function sendMagicLinkEmail(email: string, magicLink: string): Promise<boolean> {
  const subject = 'Sign in to Helpr'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Sign in to Helpr</h2>
      <p>Click the link below to sign in to your account:</p>
      <a href="${magicLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Sign In
      </a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `

  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to: email,
        from: FROM_EMAIL,
        subject,
        html
      })
      return true
    } catch (error) {
      console.error('SendGrid error:', error)
      // Fall back to console logging
      console.log('\n=== MAGIC LINK EMAIL (SendGrid failed) ===')
      console.log(`To: ${email}`)
      console.log(`Subject: ${subject}`)
      console.log(`Magic Link: ${magicLink}`)
      console.log('==========================================\n')
      return true
    }
  } else {
    // Development fallback - log to console
    console.log('\n=== MAGIC LINK EMAIL (Development Mode) ===')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Magic Link: ${magicLink}`)
    console.log('===========================================\n')
    return true
  }
}

export async function sendApplicationNotification(
  hostEmail: string,
  listingTitle: string,
  applicantSummary: string,
  reviewLink: string
): Promise<boolean> {
  const subject = `New application for ${listingTitle}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>New Application Received</h2>
      <p>You have a new application for your listing: <strong>${listingTitle}</strong></p>
      <p><strong>Applicant Summary:</strong> ${applicantSummary}</p>
      <a href="${reviewLink}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Review Application
      </a>
    </div>
  `

  return await sendEmail(hostEmail, subject, html)
}

export async function sendApplicationStatusNotification(
  tenantEmail: string,
  listingTitle: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  const subject = `Your application was ${status}`
  const statusColor = status === 'accepted' ? '#10B981' : '#EF4444'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${statusColor}">Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Your application for <strong>${listingTitle}</strong> has been ${status}.</p>
      ${status === 'accepted' ? '<p>The host will be in touch with next steps!</p>' : '<p>Don\'t worry, there are many other great listings available.</p>'}
    </div>
  `

  return await sendEmail(tenantEmail, subject, html)
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to,
        from: FROM_EMAIL,
        subject,
        html
      })
      return true
    } catch (error) {
      console.error('SendGrid error:', error)
      console.log(`\n=== EMAIL (SendGrid failed) ===`)
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Body: ${html}`)
      console.log('===============================\n')
      return true
    }
  } else {
    console.log(`\n=== EMAIL (Development Mode) ===`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Body: ${html}`)
    console.log('================================\n')
    return true
  }
}
