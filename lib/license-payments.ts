import "server-only";

import { db } from "@/database/drizzle";
import { licensePayments, licenses } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import type { PaymentPlan } from "@/lib/payment-status";

/**
 * Recompute the licence's running total from its payment rows. Recomputing (rather
 * than incrementing) means the total self-heals and can never drift from the history.
 */
export async function recomputeAmountPaid(licenseId: string): Promise<string> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${licensePayments.amount}), 0)` })
    .from(licensePayments)
    .where(eq(licensePayments.licenseId, licenseId));

  const total = String(row?.total ?? "0");
  await db
    .update(licenses)
    .set({ amount_paid: total, updated_at: new Date() })
    .where(eq(licenses.id, licenseId));
  return total;
}

/**
 * Apply a validated payment plan: store the waived discount, record any new money as a
 * payment row, then refresh the running total. Shared by create and edit so both
 * follow exactly the same rules.
 */
export async function applyPaymentPlan(params: {
  licenseId: string;
  plan: Extract<PaymentPlan, { ok: true }>;
  actor: { id: string; name: string | null };
  note?: string;
}): Promise<string> {
  const { licenseId, plan, actor } = params;

  await db
    .update(licenses)
    .set({ discount_amount: String(plan.discount), updated_at: new Date() })
    .where(eq(licenses.id, licenseId));

  if (plan.record > 0) {
    await db.insert(licensePayments).values({
      licenseId,
      amount: String(plan.record),
      paidAt: new Date(),
      note: params.note ?? null,
      createdByUserId: actor.id,
      createdByName: actor.name,
    });
  }

  return recomputeAmountPaid(licenseId);
}
