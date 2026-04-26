import { db } from "@/database/drizzle";
import { districts, licenses } from "@/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Permissions } from "@/lib/permissions";
import { requireApiPermission } from "@/lib/permissions-server";

export async function GET(req: Request) {
  const denied = await requireApiPermission(Permissions.LICENSE_REGISTER);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const districtParam = searchParams.get("districts");
  try {
    const getLicenses = await db
      .select({
        license: licenses,
        district: districts,
      })
      .from(licenses)
      .leftJoin(districts, eq(licenses.district_id, districts.id))
      .where(
        districtParam ? eq(licenses.district_id, districtParam) : undefined
      );

    const transformed = getLicenses.map((item) => ({
      ...item.license,
      location: item.district, // category hoos keen
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: `Error ${error}` }, { status: 500 });
  }
}
