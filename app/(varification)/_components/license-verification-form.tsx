"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export function LicenseVerificationForm() {
  const [licenseRefId, setLicenseRefId] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!licenseRefId.trim()) {
      toast.error("Please enter a license reference ID")
      return
    }

    setLoading(true)

    try {
      // Navigate to the verification page with the ref_id as query parameter
      const refId = encodeURIComponent(licenseRefId.trim())
      router.push(`/verify-license?ref_id=${refId}`)
    } catch (error) {
      toast.error("An error occurred. Please try again."+error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">License Verification</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enter a license reference ID to verify and view license details
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verify License
          </CardTitle>
          <CardDescription>Enter the license reference ID to retrieve license information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter license reference ID (e.g., WTMB-2506-4870050989)"
                value={licenseRefId}
                onChange={(e) => setLicenseRefId(e.target.value)}
                disabled={loading}
                className="text-lg"
              />
            </div>
            <Button type="submit" disabled={loading || !licenseRefId.trim()} className="w-full">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verifying...
                </div>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Verify License
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Example Usage */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-medium text-blue-900 dark:text-blue-100">Example License Reference IDs:</h3>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <p>• WTMB-2506-4870050989</p>
              <p>• WTMB-2506-4870033339</p>
              <p>• WTMB-2506-4870022222</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LicenseVerificationForm
