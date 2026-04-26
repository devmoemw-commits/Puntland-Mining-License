"use server"

interface LicenseData {
  id: string
  license_ref_id: string
  company_name: string
  business_type: string
  license_type: string
  license_category: string
  license_area: string
  status: string
  created_at: string
  expire_date: string
  location: {
    id: string
    name: string
    region_id: string
    created_at: string
  }
}

interface VerificationResult {
  success: boolean
  data?: LicenseData
  error?: string
}

export async function verifyLicense(formData: FormData): Promise<VerificationResult> {
  const licenseNumber = formData.get("license") as string

  if (!licenseNumber) {
    return {
      success: false,
      error: "License number is required",
    }
  }

  try {
    // Call your local API endpoint
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"

    const apiUrl = `${baseUrl}/api/verify-license?ref_id=${encodeURIComponent(licenseNumber)}`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: "License not found",
        }
      }

      if (response.status === 400) {
        return {
          success: false,
          error: "Invalid license number format",
        }
      }

      throw new Error(`API request failed with status ${response.status}`)
    }

    const data: LicenseData = await response.json()

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("License verification error:", error)

    return {
      success: false,
      error: "Failed to verify license. Please check the license number and try again.",
    }
  }
}
