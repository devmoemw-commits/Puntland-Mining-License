import { sendSimplePasswordResetEmail } from "@/lib/email-simple"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("🧪 Testing email to:", email)

    const result = await sendSimplePasswordResetEmail({
      email,
      token: "test-token-123",
      name: "Test User",
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}
