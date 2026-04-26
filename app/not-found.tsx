"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"


export default function NotFound() {
   const { data: session } = useSession()

   if (!session) {
    return redirect("/")
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md w-full mx-auto text-center px-6">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found!</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            {`Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered
            the wrong URL. If you think this is an error, please contact us.`}
          </p>
        </div>

        <div className="space-y-4">

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
