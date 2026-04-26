import { db } from "@/database/drizzle";
import { districts, regions } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";

export async function GET() {
  const denied = await requireApiPermission(Permissions.LICENSE_REGISTER);
  if (denied) return denied;

  try {
    const allCategories = await db
      .select({
        regionId: regions.id,
        regionName: regions.name,
        districtId: districts.id,
        districtName: districts.name,
      })
      .from(regions)
      .innerJoin(districts, eq(districts.region_id, regions.id))
      .orderBy(asc(regions.id), asc(districts.id)); // Optional: Order by

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "Waa la waayay categories" }, { status: 500 });
  }
}
