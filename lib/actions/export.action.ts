"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { mineralExports } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import {
  createMineralExportSchema,
  setMineralExportStatusSchema,
  updateMineralExportSchema,
} from "@/types/export-schema";

function generateExportRefId(): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `RFN-${year}${month}-${rand}`;
}

function normalize(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export const CreateMineralExport = actionClient
  .schema(createMineralExportSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
    if (denied) return { error: denied };

    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
      const refId = generateExportRefId();
      const [created] = await db
        .insert(mineralExports)
        .values({
          ref_id: refId,
          company_name: parsedInput.company_name.trim(),
          city_region: normalize(parsedInput.city_region),
          company_telephone: normalize(parsedInput.company_telephone),
          mineral_licence_no: normalize(parsedInput.mineral_licence_no),
          rep_full_name: normalize(parsedInput.rep_full_name),
          rep_position: normalize(parsedInput.rep_position),
          rep_telephone: normalize(parsedInput.rep_telephone),
          rep_id_type: normalize(parsedInput.rep_id_type),
          rep_id_number: normalize(parsedInput.rep_id_number),
          mineral_type: normalize(parsedInput.mineral_type),
          mineral_form: normalize(parsedInput.mineral_form),
          quantity: normalize(parsedInput.quantity),
          unit: normalize(parsedInput.unit),
          extraction_site: normalize(parsedInput.extraction_site),
          district_region: normalize(parsedInput.district_region),
          destination_country: normalize(parsedInput.destination_country),
          point_of_export_type: normalize(parsedInput.point_of_export_type),
          point_of_export_name: normalize(parsedInput.point_of_export_name),
          transport_mode: normalize(parsedInput.transport_mode),
          vessel_or_airline_name: normalize(parsedInput.vessel_or_airline_name),
          export_date: parsedInput.export_date
            ? new Date(parsedInput.export_date)
            : null,
          applicant_name: normalize(parsedInput.applicant_name),
          approver_title: normalize(parsedInput.approver_title),
          approver_name: normalize(parsedInput.approver_name),
          created_by_user_id: session.user.id,
          created_by_name: session.user.name ?? null,
        })
        .returning({ id: mineralExports.id });

      await logActivity({
        action: "export.create",
        entityType: "export",
        entityId: created?.id ?? null,
        entityLabel: refId,
        summary: `Registered mineral export ${refId} for ${parsedInput.company_name}`,
      });

      revalidatePath("/exports");
      return { success: "Export registered successfully", id: created?.id };
    } catch (error) {
      console.error("Error creating mineral export:", error);
      return {
        error: `Failed to register export: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

export const UpdateMineralExport = actionClient
  .schema(updateMineralExportSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
    if (denied) return { error: denied };

    const { id, ...data } = parsedInput;
    try {
      await db
        .update(mineralExports)
        .set({
          company_name: data.company_name.trim(),
          city_region: normalize(data.city_region),
          company_telephone: normalize(data.company_telephone),
          mineral_licence_no: normalize(data.mineral_licence_no),
          rep_full_name: normalize(data.rep_full_name),
          rep_position: normalize(data.rep_position),
          rep_telephone: normalize(data.rep_telephone),
          rep_id_type: normalize(data.rep_id_type),
          rep_id_number: normalize(data.rep_id_number),
          mineral_type: normalize(data.mineral_type),
          mineral_form: normalize(data.mineral_form),
          quantity: normalize(data.quantity),
          unit: normalize(data.unit),
          extraction_site: normalize(data.extraction_site),
          district_region: normalize(data.district_region),
          destination_country: normalize(data.destination_country),
          point_of_export_type: normalize(data.point_of_export_type),
          point_of_export_name: normalize(data.point_of_export_name),
          transport_mode: normalize(data.transport_mode),
          vessel_or_airline_name: normalize(data.vessel_or_airline_name),
          export_date: data.export_date ? new Date(data.export_date) : null,
          applicant_name: normalize(data.applicant_name),
          approver_title: normalize(data.approver_title),
          approver_name: normalize(data.approver_name),
          updated_at: new Date(),
        })
        .where(eq(mineralExports.id, id));

      await logActivity({
        action: "export.update",
        entityType: "export",
        entityId: id,
        summary: `Updated mineral export for ${data.company_name}`,
      });

      revalidatePath(`/exports/${id}`);
      revalidatePath("/exports");
      return { success: "Export updated successfully" };
    } catch (error) {
      console.error("Error updating mineral export:", error);
      return {
        error: `Failed to update export: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

export const SetMineralExportStatus = actionClient
  .schema(setMineralExportStatusSchema)
  .action(async ({ parsedInput: { id, status, comment } }) => {
    const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
    if (denied) return { error: denied };

    try {
      const [row] = await db
        .select({ ref: mineralExports.ref_id })
        .from(mineralExports)
        .where(eq(mineralExports.id, id))
        .limit(1);
      if (!row) return { error: "Export not found" };

      await db
        .update(mineralExports)
        .set({
          status,
          signature: status === "APPROVED",
          review_comment: comment ?? null,
          updated_at: new Date(),
        })
        .where(eq(mineralExports.id, id));

      await logActivity({
        action: "export.status_change",
        entityType: "export",
        entityId: id,
        entityLabel: row.ref,
        summary: `Mineral export ${row.ref} ${status.toLowerCase()}`,
        metadata: { to: status, comment: comment ?? null },
      });

      revalidatePath(`/exports/${id}`);
      revalidatePath("/exports");
      return { success: `Export ${status.toLowerCase()} successfully` };
    } catch (error) {
      console.error("Error updating export status:", error);
      return {
        error: `Failed to update export status: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
