import { NextResponse } from "next/server";

import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";
import { getOrgContact, getSampleSignatory } from "@/lib/data/get-sample-signatory";

// Configured signatory + org contact for sample analysis letters.
export async function GET() {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS);
  if (denied) return denied;

  try {
    const [signatory, contact] = await Promise.all([
      getSampleSignatory(),
      getOrgContact(),
    ]);
    return NextResponse.json({ ...signatory, contact });
  } catch (error) {
    console.error("Error fetching sample signatory:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample signatory" },
      { status: 500 },
    );
  }
}
