import { Resend } from "resend"
import config from "./config/config"

const resend = new Resend(process.env.RESEND_API_KEY)

type SendSimplePasswordResetEmailProps = {
  email: string
  token: string
  name?: string
}

export async function sendSimplePasswordResetEmail({ email, token, name }: SendSimplePasswordResetEmailProps) {
  const resetLink = `${config.env.apiEndpoint}/reset-password/${token}`

  console.log("🔧 Simple Email Debug Info:")
  console.log("- Recipient:", email)
  console.log("- Reset Link:", resetLink)

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Password Reset</h1>
        <p>Hi ${name || "there"},</p>
        <p>Someone requested a password reset for your account. If this was you, click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 14px;">
          If the button doesn't work, copy and paste this URL into your browser:<br>
          <a href="${resetLink}">${resetLink}</a>
        </p>
      </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: "Password Reset <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: htmlContent,
    })

    if (error) {
      console.error("❌ Simple Email Error:", error)
      return { success: false, error: error.message }
    }

    console.log("✅ Simple email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("❌ Unexpected error sending simple email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
