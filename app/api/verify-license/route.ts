import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { districts, licenses } from "@/database/schema";
import { eq } from "drizzle-orm";

export interface Root {
  id: string;
  license_ref_id: string;
  company_name: string;
  business_type: string;
  license_type: string;
  license_category: string;
  license_area: string;
  created_at: string;
  expire_date: string;
  location: Location;
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";
}

export interface Location {
  id: string;
  name: string;
  region_id: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const refId = searchParams.get("ref_id");

  if (!refId) {
    return NextResponse.json(
      { error: "License reference ID is required" },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .select({
        id: licenses.id,
        license_ref_id: licenses.license_ref_id,
        company_name: licenses.company_name,
        business_type: licenses.business_type,
        license_type: licenses.license_type,
        license_category: licenses.license_category,
        license_area: licenses.license_area,
        created_at: licenses.created_at,
        expire_date: licenses.expire_date,
        status: licenses.status,
        location: districts,
      })
      .from(licenses)
      .leftJoin(districts, eq(licenses.district_id, districts.id))
      .where(eq(licenses.license_ref_id, refId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Return only public information (remove sensitive data)
    const publicLicenseInfo = {
      id: row.id,
      license_ref_id: row.license_ref_id,
      company_name: row.company_name,
      business_type: row.business_type,
      license_type: row.license_type,
      license_category: row.license_category,
      license_area: row.license_area,
      created_at: row.created_at,
      expire_date: row.expire_date,
      location: row.location,
      status: row.status,
    };

    return NextResponse.json(publicLicenseInfo);
  } catch (error) {
    console.error("Error verifying license:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
