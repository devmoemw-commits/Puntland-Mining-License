import { db } from "@/database/drizzle";
import { sampleAnalysis } from "@/database/schema";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

export async function GET() {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS);
  if (denied) return denied;

  try {
    const getSamples = await db.select().from(sampleAnalysis);

    return NextResponse.json(getSamples);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Waa la waayay categories" }, { status: 500 });
  }
}
