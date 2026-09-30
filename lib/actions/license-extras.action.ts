"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  inspectionReports,
  licensePayments,
  licenseRenewals,
  licenses,
} from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import {
  createInspectionReportSchema,
  createRenewalSchema,
  recordPaymentSchema,
} from "@/types/license-schema";
import { getBalance, getPaymentStatus } from "@/lib/payment-status";

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

/**
 * Record a payment collected against a licence. Supports instalments: paying
 * 3,000 of a 5,000 fee leaves the licence "Partially Paid" with a 2,000 balance
 * that can be collected later. Append-only — each collection is its own row.
 */
export const RecordLicensePayment = actionClient
  .schema(recordPaymentSchema)
  .action(async ({ parsedInput }) => {
    // Kept simple: whoever handles licences can record a collection, so a
    // counter payment never has to wait on an admin. Every entry is logged.
    const denied = await requireActionPermission(Permissions.LICENSE_REGISTER);
    if (denied) return { error: denied };

    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const amount = Number(parsedInput.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Amount must be greater than zero" };
    }

    try {
      const [lic] = await db
        .select({
          ref: licenses.license_ref_id,
          fee: licenses.calculated_fee,
          paid: licenses.amount_paid,
          isFree: licenses.is_free,
        })
        .from(licenses)
        .where(eq(licenses.id, parsedInput.licenseId))
        .limit(1);
      if (!lic) return { error: "License not found" };

      if (lic.isFree) {
        return { error: "This licence is Free — no payment is due." };
      }

      const balance = getBalance(lic.fee, lic.paid);
      if (balance <= 0) {
        return { error: "This licence is already fully paid." };
      }
      if (amount > balance + 0.005) {
        return {
          error: `Amount exceeds the outstanding balance of ${balance.toLocaleString()}.`,
        };
      }

      await db.insert(licensePayments).values({
        licenseId: parsedInput.licenseId,
        amount: String(amount),
        paidAt: parsedInput.paidAt ? new Date(parsedInput.paidAt) : new Date(),
        receiptNumber: parsedInput.receiptNumber?.trim() || null,
        note: parsedInput.note?.trim() || null,
        createdByUserId: session.user.id,
        createdByName: session.user.name ?? null,
      });

      // Recompute from the rows rather than incrementing, so the running total
      // self-heals and can never drift from the payment history.
      const [totals] = await db
        .select({ total: sql<string>`coalesce(sum(${licensePayments.amount}), 0)` })
        .from(licensePayments)
        .where(eq(licensePayments.licenseId, parsedInput.licenseId));

      const newPaid = String(totals?.total ?? "0");
      await db
        .update(licenses)
        .set({ amount_paid: newPaid, updated_at: new Date() })
        .where(eq(licenses.id, parsedInput.licenseId));

      const status = getPaymentStatus({
        isFree: lic.isFree,
        fee: lic.fee,
        paid: newPaid,
      });
      const remaining = getBalance(lic.fee, newPaid);

      await logActivity({
        action: "license.payment",
        entityType: "license",
        entityId: parsedInput.licenseId,
        entityLabel: lic.ref,
        summary: `Payment of ${amount.toLocaleString()} recorded for ${lic.ref} — ${
          status === "PAID"
            ? "now fully paid"
            : `${remaining.toLocaleString()} outstanding`
        }`,
        metadata: {
          amount,
          totalPaid: Number(newPaid),
          balance: remaining,
          receiptNumber: parsedInput.receiptNumber ?? null,
        },
      });

      revalidatePath(`/licenses/${parsedInput.licenseId}`);
      revalidatePath("/licenses");
      return {
        success:
          status === "PAID"
            ? "Payment recorded — licence fully paid"
            : `Payment recorded — ${remaining.toLocaleString()} still outstanding`,
      };
    } catch (error) {
      console.error("Error recording payment:", error);
      return {
        error: `Failed to record payment: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
