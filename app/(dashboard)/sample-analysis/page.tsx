import { TSample, columns } from "./columns"
import { DataTable } from "./data-table"
import { db } from "@/database/drizzle"
import { sampleAnalysis } from "@/database/schema"
import { Permissions } from "@/lib/permissions"
import { requireActionPermission } from "@/lib/permissions-server"

// fetch sample analysis data directly from DB
async function getLicenses(): Promise<TSample[]> {
  const denied = await requireActionPermission(Permissions.SAMPLE_ANALYSIS_ACCESS)
  if (denied) {
    console.error("Access denied while loading samples:", denied)
    return []
  }

  try {
    const rows = await db.select().from(sampleAnalysis)
    return rows.map((row) => ({
      id: row.id,
      ref_id: row.ref_id,
      name: row.name,
      passport_no: row.passport_no,
      kilo_gram: `${row.amount?.toString() ?? "0"} ${row.unit ?? ""}`.trim(),
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at ?? ""),
      updated_at:
        row.updated_at instanceof Date
          ? row.updated_at.toISOString()
          : String(row.updated_at ?? ""),
    }))
  } catch (error) {
    console.error("Error loading samples:", error)
    return []
  }
}

export default async function Page() {
  const data = await getLicenses()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
