"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { inspectionReports, licenseRenewals, licenses } from "@/database/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import {
  createInspectionReportSchema,
  createRenewalSchema,
} from "@/types/license-schema";

/** Record a site inspection report for a license (LICENSE_REVIEW capability). */
export const CreateInspectionReport = actionClient
  .schema(createInspectionReportSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.LICENSE_REVIEW);
    if (denied) return { error: denied };

    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
      const [lic] = await db
        .select({ ref: licenses.license_ref_id })
        .from(licenses)
        .where(eq(licenses.id, parsedInput.licenseId))
        .limit(1);
      if (!lic) return { error: "License not found" };

      await db.insert(inspectionReports).values({
        licenseId: parsedInput.licenseId,
        inspectionDate: parsedInput.inspectionDate
          ? new Date(parsedInput.inspectionDate)
          : null,
        inspectorName: parsedInput.inspectorName.trim(),
        gpsVerified: parsedInput.gpsVerified ?? false,
        recommendation: parsedInput.recommendation ?? null,
        notes: parsedInput.notes?.trim() || null,
        photos: parsedInput.photos?.trim() || null,
        createdByUserId: session.user.id,
        createdByName: session.user.name ?? null,
      });

      await logActivity({
        action: "inspection.create",
        entityType: "license",
        entityId: parsedInput.licenseId,
        entityLabel: lic.ref,
        summary: `Inspection report added for ${lic.ref}`,
        metadata: { recommendation: parsedInput.recommendation ?? null },
      });

      revalidatePath(`/licenses/${parsedInput.licenseId}`);
      return { success: "Inspection report added" };
    } catch (error) {
      console.error("Error creating inspection report:", error);
      return {
        error: `Failed to add inspection report: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

/** Record a renewal: appends history and extends the license expire_date (LICENSE_MODERATE). */
export const CreateLicenseRenewal = actionClient
  .schema(createRenewalSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.LICENSE_MODERATE);
    if (denied) return { error: denied };

    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const newExpire = new Date(parsedInput.newExpireDate);
    if (Number.isNaN(newExpire.getTime())) {
      return { error: "Invalid new expiry date" };
    }

    try {
      const [lic] = await db
        .select({ ref: licenses.license_ref_id, expire: licenses.expire_date })
        .from(licenses)
        .where(eq(licenses.id, parsedInput.licenseId))
        .limit(1);
      if (!lic) return { error: "License not found" };

      await db.insert(licenseRenewals).values({
        licenseId: parsedInput.licenseId,
        previousExpireDate: lic.expire ?? null,
        newExpireDate: newExpire,
        fee: parsedInput.fee?.trim() || null,
        receiptNumber: parsedInput.receiptNumber?.trim() || null,
        notes: parsedInput.notes?.trim() || null,
        createdByUserId: session.user.id,
        createdByName: session.user.name ?? null,
      });

      // Extend the license validity (additive update — no data removed).
      await db
        .update(licenses)
        .set({ expire_date: newExpire, updated_at: new Date() })
        .where(eq(licenses.id, parsedInput.licenseId));

      await logActivity({
        action: "license.renew",
        entityType: "license",
        entityId: parsedInput.licenseId,
        entityLabel: lic.ref,
        summary: `License ${lic.ref} renewed to ${newExpire.toLocaleDateString()}`,
        metadata: {
          previous: lic.expire ? new Date(lic.expire).toISOString() : null,
          next: newExpire.toISOString(),
        },
      });

      revalidatePath(`/licenses/${parsedInput.licenseId}`);
      return { success: "License renewed successfully" };
    } catch (error) {
      console.error("Error creating renewal:", error);
      return {
        error: `Failed to renew license: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
