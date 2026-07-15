import { NextResponse } from "next/server";

import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";
import { listActiveBusinessTypes } from "@/lib/data/get-business-types";

// Active business types for the application forms (create & edit).
export async function GET() {
  const denied = await requireApiPermission(Permissions.LICENSE_REGISTER);
  if (denied) return denied;

  try {
    const types = await listActiveBusinessTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching business types:", error);
    return NextResponse.json(
      { error: "Failed to fetch business types" },
      { status: 500 },
    );
  }
}
