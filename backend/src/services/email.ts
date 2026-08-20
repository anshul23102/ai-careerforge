import { Resend } from 'resend'

const RESET_EMAIL_FROM = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: `AI CareerForge <${RESET_EMAIL_FROM}>`,
    to,
    subject: 'Reset your AI CareerForge password',
    html: `
      <p>Someone requested a password reset for your AI CareerForge account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 15 minutes.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}
