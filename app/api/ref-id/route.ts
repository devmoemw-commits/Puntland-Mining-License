// app/api/ref-id/route.ts (Next.js 13+)
import { NextResponse } from "next/server";

import { count } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { sampleAnalysis } from "@/database/schema";
import { requireApiPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

export async function GET() {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS);
  if (denied) return denied;

  const totalSamples = await db
    .select({ count: count() })
    .from(sampleAnalysis);

  const sampleCount = Number(totalSamples[0]?.count ?? 0);
  const serial = String(sampleCount + 1).padStart(2, "0");

  const now = new Date();
  const year = String(now.getFullYear()).slice(2);

  const refId = `${serial}/${year}`;

  return NextResponse.json({ refId });
}
