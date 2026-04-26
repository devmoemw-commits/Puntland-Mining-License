import config from "@/lib/config/config";
import { type NextRequest, NextResponse } from "next/server";

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
    // Replace with your actual API endpoint
    const response = await fetch(`${config.env.apiEndpoint}/api/licenses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch licenses");
    }

    const licenses = await response.json();

    // Find the license by reference ID
    const license = licenses.find((l: Root) => l.license_ref_id === refId);

    if (!license) {
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    }

    // Return only public information (remove sensitive data)
    const publicLicenseInfo = {
      id: license.id,
      license_ref_id: license.license_ref_id,
      company_name: license.company_name,
      business_type: license.business_type,
      license_type: license.license_type,
      license_category: license.license_category,
      license_area: license.license_area,
      created_at: license.created_at,
      expire_date: license.expire_date,
      location: license.location,
      status: license.status
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
