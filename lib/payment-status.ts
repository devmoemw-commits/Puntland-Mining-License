/**
 * Payment state for a licence, derived from the fee charged vs the amount collected.
 * Shared by the list, detail page and exports so they can never disagree.
 */

export type PaymentStatus = "FREE" | "UNPAID" | "PARTIAL" | "PAID";

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Small tolerance so 2999.999999 from float maths still counts as fully paid. */
const EPSILON = 0.005;

export function getPaymentStatus(input: {
  isFree?: boolean | null;
  fee?: string | number | null;
  paid?: string | number | null;
}): PaymentStatus {
  const fee = toNumber(input.fee);
  const paid = toNumber(input.paid);

  if (input.isFree || fee <= 0) return "FREE";
  if (paid <= 0) return "UNPAID";
  if (paid + EPSILON >= fee) return "PAID";
  return "PARTIAL";
}

/** Outstanding amount still to collect (never negative). */
export function getBalance(
  fee: string | number | null | undefined,
  paid: string | number | null | undefined,
): number {
  return Math.max(0, toNumber(fee) - toNumber(paid));
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  FREE: "Free",
  UNPAID: "Unpaid",
  PARTIAL: "Partially Paid",
  PAID: "Paid",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  FREE: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300",
  UNPAID: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300",
  PARTIAL: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300",
  PAID: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
};

/** Money formatting used across the licence screens. */
export function formatMoney(v: string | number | null | undefined): string {
  return toNumber(v).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
