// app/api/ref-id/route.ts (Next.js 13+)
import { NextResponse } from "next/server";

import { count } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { sampleAnalysis } from "@/database/schema";

export async function GET() {
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
