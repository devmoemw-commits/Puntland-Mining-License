import { Resend } from "resend"
import { ResetPasswordEmail } from "@/components/emails/reset-password-email"

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

type SendPasswordResetEmailProps = {
  email: string
  token: string
  name?: string
}

export async function sendPasswordResetEmail({ email, token, name }: SendPasswordResetEmailProps) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: "Puntland Mining <noreply@plmininglicense.com>",
      to: email,
      subject: "Reset your password",
      react: ResetPasswordEmail({ resetLink, userName: name }),
    })

    if (error) {
      console.error("Failed to send email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}
