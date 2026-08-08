import { db } from "@/database/drizzle";
import { inspectionReports, licenseRenewals } from "@/database/schema";
import { desc, eq } from "drizzle-orm";

export type InspectionReportRow = {
  id: string;
  inspectionDate: string | null;
  inspectorName: string | null;
  gpsVerified: boolean;
  recommendation: string | null;
  notes: string | null;
  photos: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type RenewalRow = {
  id: string;
  previousExpireDate: string | null;
  newExpireDate: string;
  fee: string | null;
  receiptNumber: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
};

const iso = (v: Date | string | null | undefined): string | null =>
  v == null ? null : v instanceof Date ? v.toISOString() : String(v);

export async function listInspectionReports(
  licenseId: string,
): Promise<InspectionReportRow[]> {
  const rows = await db
    .select()
    .from(inspectionReports)
    .where(eq(inspectionReports.licenseId, licenseId))
    .orderBy(desc(inspectionReports.createdAt));
  return rows.map((r) => ({
    id: r.id,
    inspectionDate: iso(r.inspectionDate),
    inspectorName: r.inspectorName,
    gpsVerified: r.gpsVerified,
    recommendation: r.recommendation,
    notes: r.notes,
    photos: r.photos,
    createdByName: r.createdByName,
    createdAt: iso(r.createdAt) ?? "",
  }));
}

export async function listRenewals(licenseId: string): Promise<RenewalRow[]> {
  const rows = await db
    .select()
    .from(licenseRenewals)
    .where(eq(licenseRenewals.licenseId, licenseId))
    .orderBy(desc(licenseRenewals.createdAt));
  return rows.map((r) => ({
    id: r.id,
    previousExpireDate: iso(r.previousExpireDate),
    newExpireDate: iso(r.newExpireDate) ?? "",
    fee: r.fee != null ? String(r.fee) : null,
    receiptNumber: r.receiptNumber,
    notes: r.notes,
    createdByName: r.createdByName,
    createdAt: iso(r.createdAt) ?? "",
  }));
}
