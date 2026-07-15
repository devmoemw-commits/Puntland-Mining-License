import { sendSimplePasswordResetEmail } from "@/lib/email-simple"
import { type NextRequest, NextResponse } from "next/server"
import { requireApiPermission } from "@/lib/permissions-server"
import { Permissions } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  const denied = await requireApiPermission(Permissions.SYSTEM_SETTINGS)
  if (denied) return denied

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
