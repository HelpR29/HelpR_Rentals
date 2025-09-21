import { sendEmail } from './email';

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const verificationLink = `${baseUrl}/api/verification/confirm-email?token=${token}`;

  const emailBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">Verify Your Email Address</h2>
      <p style="font-size: 16px; color: #555;">Welcome to Helpr! To complete your account setup, please verify your email address by clicking the button below.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email</a>
      </div>
      <p style="font-size: 14px; color: #777;">If you did not request this verification, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #aaa; text-align: center;">Helpr | Smart Rentals</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your Email for Helpr',
    html: emailBody,
  });
}
