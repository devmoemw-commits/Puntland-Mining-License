import { db } from "@/database/drizzle";
import { mineralExports } from "@/database/schema";
import { desc, eq } from "drizzle-orm";

export type MineralExportRow = typeof mineralExports.$inferSelect;

export type MineralExportView = {
  id: string;
  ref_id: string;
  company_name: string;
  city_region: string | null;
  company_telephone: string | null;
  mineral_licence_no: string | null;
  rep_full_name: string | null;
  rep_position: string | null;
  rep_telephone: string | null;
  rep_id_type: string | null;
  rep_id_number: string | null;
  mineral_type: string | null;
  mineral_form: string | null;
  quantity: string | null;
  unit: string | null;
  extraction_site: string | null;
  district_region: string | null;
  destination_country: string | null;
  point_of_export_type: string | null;
  point_of_export_name: string | null;
  transport_mode: string | null;
  vessel_or_airline_name: string | null;
  export_date: string | null;
  applicant_name: string | null;
  approver_title: string | null;
  approver_name: string | null;
  status: string;
  signature: boolean;
  review_comment: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

const iso = (v: Date | string | null | undefined): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

function toView(r: MineralExportRow): MineralExportView {
  return {
    id: r.id,
    ref_id: r.ref_id,
    company_name: r.company_name,
    city_region: r.city_region,
    company_telephone: r.company_telephone,
    mineral_licence_no: r.mineral_licence_no,
    rep_full_name: r.rep_full_name,
    rep_position: r.rep_position,
    rep_telephone: r.rep_telephone,
    rep_id_type: r.rep_id_type,
    rep_id_number: r.rep_id_number,
    mineral_type: r.mineral_type,
    mineral_form: r.mineral_form,
    quantity: r.quantity != null ? String(r.quantity) : null,
    unit: r.unit,
    extraction_site: r.extraction_site,
    district_region: r.district_region,
    destination_country: r.destination_country,
    point_of_export_type: r.point_of_export_type,
    point_of_export_name: r.point_of_export_name,
    transport_mode: r.transport_mode,
    vessel_or_airline_name: r.vessel_or_airline_name,
    export_date: iso(r.export_date),
    applicant_name: r.applicant_name,
    approver_title: r.approver_title,
    approver_name: r.approver_name,
    status: r.status,
    signature: r.signature ?? false,
    review_comment: r.review_comment,
    created_by_name: r.created_by_name,
    created_at: iso(r.created_at) ?? "",
    updated_at: iso(r.updated_at) ?? "",
  };
}

export async function listMineralExports(): Promise<MineralExportView[]> {
  const rows = await db
    .select()
    .from(mineralExports)
    .orderBy(desc(mineralExports.created_at));
  return rows.map(toView);
}

export async function getMineralExportById(
  id: string,
): Promise<MineralExportView | null> {
  const [row] = await db
    .select()
    .from(mineralExports)
    .where(eq(mineralExports.id, id))
    .limit(1);
  return row ? toView(row) : null;
}
