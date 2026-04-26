"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast, Toaster } from "sonner"
import { LicenseUpdateForm, type License } from "@/components/license-update-form"

export default function EditLicensePage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const params = use(props.params)
  const [license, setLicense] = useState<License | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const response = await fetch(`/api/licenses/${params.id}`)

        if (!response.ok) {
          throw new Error("Failed to fetch license")
        }

        const data = await response.json()
        setLicense(data)
      } catch (err) {
        setError("Failed to load license data. Please try again later.")
        toast.error("Failed to load license data"+err)
      } finally {
        setLoading(false)
      }
    }

    fetchLicense()
  }, [params.id])

  const handleSuccess = () => {
    router.push(`/licenses/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading license data...</span>
      </div>
    )
  }

  if (error || !license) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2">{error || "License not found"}</p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <Toaster position="top-right" />
      <LicenseUpdateForm license={license} onSuccess={handleSuccess} />
    </div>
  )
}
