// import { getLicenses } from "@/data"

import Link from "next/link"
import { Plus } from "lucide-react"
import { headers } from "next/headers"

import { DataTable } from "./_components/data-table"
import { columns, License } from "./column"

//fetch license data from api
async function getLicenses(): Promise<License[]> {
  try {
    const headerStore = await headers()
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
    const protocol = headerStore.get("x-forwarded-proto") ?? "https"
    const baseUrl = host ? `${protocol}://${host}` : "http://localhost:3000"

    const res = await fetch(`${baseUrl}/api/licenses`, {
      method: "GET",
      cache: "no-store",
    })
    if (!res.ok) {
      console.error("Failed to load licenses:", res.status, res.statusText)
      return []
    }
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/json")) {
      console.error("Unexpected response content type for /api/licenses:", contentType)
      return []
    }
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error loading licenses:", error)
    return []
  }
}

export default async function LicensesPage() {
  const data = await getLicenses()

  return (
    <div className="">
      <div className='flex items-center justify-between my-5 group'>
        <h1 className="font-semibold text-xl text-gray-800 dark:text-gray-200">Licenses</h1>
        <Link href={'/licenses/create'} className='flex items-center gap-2 bg-primary text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800'>
          <span>Create New License</span>
          <Plus className='mr-2' />
        </Link>
      </div>
      <div className="space-y-4">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}
