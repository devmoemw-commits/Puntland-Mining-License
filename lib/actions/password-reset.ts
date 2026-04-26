"use server"

import { db } from "@/database/drizzle"
import { users, passwordResetTokens } from "@/database/schema"
import { usersPasswordResetLookup } from "@/lib/data/users-select"
import { eq, and, sql } from "drizzle-orm"
import { hash } from "bcryptjs"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { sendSimplePasswordResetEmail } from "@/lib/email-simple"

// Function to request a password reset
export async function requestPasswordReset(email: string) {
  try {
    console.log("🔄 Processing password reset request for:", email)

    // Check if user exists
    const userExists = await db
      .select(usersPasswordResetLookup)
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    // For security reasons, always return success even if user doesn't exist
    if (userExists.length === 0) {
      console.log("⚠️ User not found, but returning success for security")
      return { success: true }
    }

    console.log("✅ User found:", userExists[0].name)

    // Invalidate existing tokens for this email (no row deletes — retain for audit)
    const expired = new Date(0)
    await db
      .update(passwordResetTokens)
      .set({ expires: expired })
      .where(eq(passwordResetTokens.email, email))
    console.log("🗑️ Invalidated existing tokens")

    // Create a new token
    const token = randomUUID()
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // Token expires in 1 hour

    // Store the token
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expires,
    })
    console.log("💾 Token stored in database")

    // Send the password reset email
    console.log("📧 Attempting to send email...")
    const emailResult = await sendSimplePasswordResetEmail({
      email,
      token,
      name: userExists[0].name || undefined,
    })

    if (!emailResult.success) {
      console.error("❌ Email sending failed:", emailResult.error)
      // Still return success to user for security, but log the error
    } else {
      console.log("✅ Email sent successfully")
    }

    return { success: true }
  } catch (error) {
    console.error("❌ Password reset request error:", error)
    return { success: false, error: "Failed to process password reset request" }
  }
}

// Function to validate a reset token
export async function validateResetToken(token: string) {
  try {
    // Find the token and check if it's not expired using SQL
    const tokenRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), sql`${passwordResetTokens.expires} > NOW()`))
      .limit(1)

    if (tokenRecord.length === 0) {
      return { isValid: false, email: "" }
    }

    return { isValid: true, email: tokenRecord[0].email }
  } catch (error) {
    console.error("Token validation error:", error)
    return { isValid: false, email: "" }
  }
}

// Function to reset the password
export async function resetPassword({ token, password }: { token: string; password: string }) {
  try {
    // Find the token and check if it's not expired using SQL
    const tokenRecord = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), sql`${passwordResetTokens.expires} > NOW()`))
      .limit(1)

    if (tokenRecord.length === 0) {
      return { success: false, error: "Invalid or expired token" }
    }

    const email = tokenRecord[0].email

    // Hash the new password
    const hashedPassword = await hash(password, 10)

    // Update the user's password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email))

    // Invalidate the used token (no row deletes — retain for audit)
    await db
      .update(passwordResetTokens)
      .set({ expires: new Date(0) })
      .where(eq(passwordResetTokens.token, token))

    revalidatePath("/login")

    return { 
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
     }
  } catch (error) {
    console.error("Password reset error:", error)
    return { success: false, error: "Failed to reset password" }
  }
}
