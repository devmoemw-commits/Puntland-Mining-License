// GET single sample by ID
import { db } from "@/database/drizzle"
import { sampleAnalysis } from "@/database/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireApiPermission } from "@/lib/permissions-server"
import { Permissions } from "@/lib/permissions"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Context) {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS)
  if (denied) return denied

  const { id: sampleId } = await params

  try {
    const sampleData = await db.select().from(sampleAnalysis).where(eq(sampleAnalysis.id, sampleId)).limit(1)

    if (sampleData.length === 0) {
      return NextResponse.json({ message: "Sample not found" }, { status: 404 })
    }

    return NextResponse.json(sampleData[0]) // return the single item directly
  } catch (error) {
    console.error("Error fetching single sample:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
