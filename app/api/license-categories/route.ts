import { NextResponse } from "next/server";

import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";
import { listActiveLicenseCategories } from "@/lib/data/get-license-categories";

// Active license categories for the application forms (create & edit).
export async function GET() {
  const denied = await requireApiPermission(Permissions.LICENSE_REGISTER);
  if (denied) return denied;

  try {
    const categories = await listActiveLicenseCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching license categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch license categories" },
      { status: 500 },
    );
  }
}
