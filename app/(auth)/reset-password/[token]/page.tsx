
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ResetPasswordForm } from "../../_components/reset-password-form"
import { validateResetToken } from "@/lib/actions/password-reset"
import Image from "next/image"

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params
  const { isValid, email } = await validateResetToken(token)

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[550px] shadow-md rounded-md p-24">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex items-center justify-center">
            <Image src="/assets/puntland_logo.svg" width={100} height={100} alt="Puntland Logo" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Create a new password for your account</p>
        </div>

        {isValid ? (
          <ResetPasswordForm token={token} email={email} />
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid or expired token</AlertTitle>
              <AlertDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/forgot-password">Request New Reset Link</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata() {

  return {
    title: "Reset Password",
    description: "Reset your password",
    
  }
}