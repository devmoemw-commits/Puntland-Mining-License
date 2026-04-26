"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { UpdateSampleAnalysis } from "@/lib/actions/sample.action"
import ReusableSampleForm from "../_components/view-sample"


//  name: "",
//       nationality: "",
//       passportNo: "",
//       amount: "",
//       unit: "kilogram",
//       mineralType: "",
// Use the same interface as the reusable component
interface SampleData {
  id?: string
  ref_id: string

  name: string
  nationality: string 
  passport_no: string
  amount: string
  unit: string
  mineral_type: string


  signature?: boolean
  created_at?: string
  updated_at?: string
}

// Define the TSample type for API responses
type TSample = {
  id: string
  ref_id: string
  name: string
  nationality: string
  passport_no: string 
  amount: string
  unit: string
  mineral_type: string

  signature?: boolean
  created_at: string
  updated_at: string
}

async function fetchSampleById(id: string): Promise<TSample | null> {
  const res = await fetch(`/api/samples/${id}`, {
    cache: "no-cache",
  })

  if (!res.ok) return null

  const data = await res.json()
  return data
}

export default function SampleDetailPage() {
  const { id: sampleId } = useParams<{ id: string }>()

  const [mode, setMode] = useState<"update" | "view">("view")
  const [sampleData, setSampleData] = useState<TSample | null>(null)
  const [loading, setLoading] = useState(true)

  // Update the function to accept SampleData (same as reusable component)
  const updateSample = async (data: SampleData) => {
    try {
      // Ensure id is available before making the API call
      if (!data.id) {
        console.error("Sample ID is required for update")
        return false
      }

      const result = await UpdateSampleAnalysis({
        id: data.id,
        name: data.name,
        passport_no: data.passport_no,
        amount: data.amount,
        unit: data.unit,
        mineral_type: data.mineral_type,
        nationality: data.nationality,
      })

      if (result?.data?.success) {
        return true
      } else if (result?.data?.error) {
        console.error("Update error:", result.data.error)
        return false
      }
      return false
    } catch (error) {
      console.error("Error updating sample:", error)
      return false
    }
  }

  // Use SampleData type to match the form component's expectations
  const handleSubmit = async (data: SampleData): Promise<boolean> => {
    if (mode === "update") {
      const success = await updateSample(data)
      if (success) {
        // Convert form data back to TSample for state update
        const updatedSample: TSample = {
          id: data.id || sampleData!.id,
          ref_id: data.ref_id,
          name: data.name,
          passport_no: data.passport_no,
          amount: data.amount,
          unit: data.unit,
          mineral_type: data.mineral_type,
          nationality: data.nationality,
          signature: data.signature || false,
          created_at: data.created_at || sampleData!.created_at,
          updated_at: new Date().toISOString(),
        }
        setSampleData(updatedSample)
        setMode("view")
      }
      return success
    }
    return false
  }

  useEffect(() => {
    if (!sampleId) return

    const loadData = async () => {
      try {
        const data = await fetchSampleById(sampleId)
        setSampleData(data)
      } catch (error) {
        console.error("Failed to fetch sample:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [sampleId])

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]">Loading sample data...</div>
  }

  if (!sampleData) {
    return <div className="flex justify-center items-center min-h-[60vh]">Sample not found</div>
  }

  // Convert TSample to SampleData for the form component
  const formData: SampleData = {
    id: sampleData.id,
    ref_id: sampleData.ref_id,
    name: sampleData.name,
    passport_no: sampleData.passport_no,
    amount: sampleData.amount,
    unit: sampleData.unit,
    mineral_type: sampleData.mineral_type,
    nationality: sampleData.nationality,
    signature: sampleData.signature,
    created_at: sampleData.created_at,
    updated_at: sampleData.updated_at,
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex gap-4 justify-center">
        <button
          onClick={() => setMode("update")}
          className={`px-4 py-2 rounded dark:text-gray-800 ${mode === "update" ? "bg-primary text-white" : "bg-gray-200"}`}
        >
          Edit Mode
        </button>
        <button
          onClick={() => setMode("view")}
          className={`px-4 py-2 rounded dark:text-gray-800 ${mode === "view" ? "bg-primary text-white" : "bg-gray-200"}`}
        >
          View Mode
        </button>
      </div>

      <ReusableSampleForm mode={mode} initialData={formData} onSubmit={handleSubmit} />
    </div>
  )
}
