import { db } from "@/database/drizzle";
import { districts, licenses } from "@/database/schema";
import { desc, eq } from "drizzle-orm";

export type MapLicense = {
  id: string;
  ref: string;
  company: string;
  status: string;
  region: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
};

export async function listMapLicenses(): Promise<MapLicense[]> {
  const rows = await db
    .select({
      id: licenses.id,
      ref: licenses.license_ref_id,
      company: licenses.company_name,
      status: licenses.status,
      region: licenses.region,
      district: districts.name,
      lat: licenses.latitude,
      lng: licenses.longitude,
    })
    .from(licenses)
    .leftJoin(districts, eq(licenses.district_id, districts.id))
    .orderBy(desc(licenses.created_at));

  return rows.map((r) => ({
    id: r.id,
    ref: r.ref,
    company: r.company,
    status: r.status,
    region: r.region ?? null,
    district: r.district ?? null,
    lat: r.lat != null ? Number(r.lat) : null,
    lng: r.lng != null ? Number(r.lng) : null,
  }));
}
