// import { getLicenses } from "@/data"

import Link from "next/link"
import { Plus } from "lucide-react"

import { DataTable } from "./_components/data-table"
import { columns, License } from "./column"
import { db } from "@/database/drizzle"
import { districts, licenses } from "@/database/schema"
import { eq } from "drizzle-orm"
import { Permissions } from "@/lib/permissions"
import { requireActionPermission } from "@/lib/permissions-server"

//fetch license data from api
async function getLicenses(): Promise<License[]> {
  const denied = await requireActionPermission(Permissions.LICENSE_REGISTER)
  if (denied) {
    console.error("Access denied while loading licenses:", denied)
    return []
  }

  try {
    const rows = await db
      .select({
        license: licenses,
        district: districts,
      })
      .from(licenses)
      .leftJoin(districts, eq(licenses.district_id, districts.id))

    return rows.map((item) => ({
      ...item.license,
      location: item.district,
    })) as License[]
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
