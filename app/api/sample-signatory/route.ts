import { NextResponse } from "next/server";

import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";
import { getSampleSignatory } from "@/lib/data/get-sample-signatory";

// Configured signatory for sample analysis letters (name, title, profile signature).
export async function GET() {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS);
  if (denied) return denied;

  try {
    const signatory = await getSampleSignatory();
    return NextResponse.json(signatory);
  } catch (error) {
    console.error("Error fetching sample signatory:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample signatory" },
      { status: 500 },
    );
  }
}
