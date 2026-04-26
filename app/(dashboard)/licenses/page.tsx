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

    return rows.map((item) => {
      const row = item.license
      return {
        ...row,
        company_address: row.company_address ?? "",
        region: row.region ?? "",
        country_of_origin: row.country_of_origin ?? "",
        full_name: row.full_name ?? "",
        mobile_number: row.mobile_number ?? "",
        email_address: row.email_address ?? "",
        id_card_number: row.id_card_number ?? "",
        passport_photos: row.passport_photos ?? "",
        company_profile: row.company_profile ?? "",
        receipt_of_payment: row.receipt_of_payment ?? "",
        license_type: row.license_type ?? "",
        license_category: row.license_category ?? "",
        calculated_fee: row.calculated_fee?.toString() ?? "",
        license_area: Array.isArray(row.license_area)
          ? row.license_area.join(", ")
          : row.license_area ?? "",
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at ?? ""),
        updated_at:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : String(row.updated_at ?? ""),
        expire_date:
          row.expire_date instanceof Date
            ? row.expire_date.toISOString()
            : String(row.expire_date ?? ""),
        location: item.district
          ? {
              id: item.district.id,
              name: item.district.name,
              region_id: item.district.region_id,
              created_at:
                item.district.created_at instanceof Date
                  ? item.district.created_at.toISOString()
                  : String(item.district.created_at ?? ""),
            }
          : undefined,
      }
    })
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
