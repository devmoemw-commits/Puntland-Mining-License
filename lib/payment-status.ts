/**
 * Licence payment rules — the single source of truth shared by the application form,
 * the edit form, the server actions, the list, the detail page and the exports.
 *
 * A licence ends up in exactly one of four states (plus a legacy fallback):
 *   - Paid Full       collected the whole category fee
 *   - Discount        part of the fee was waived; the rest was collected -> nothing owed
 *   - Paid Partially  part collected; the remainder is STILL OWED
 *   - Free            no charge
 *   - Unpaid          legacy only: chargeable licence with nothing recorded yet
 *
 * The fee itself always comes from the licence category (new / renewal fee).
 */

export type PaymentStatus = "PAID" | "DISCOUNT" | "PARTIAL" | "FREE" | "UNPAID";

/** What the person chooses on the application / edit form. */
export type PaymentChoice = "FULL" | "DISCOUNT" | "PARTIAL" | "FREE";

export const PAYMENT_CHOICES: { value: PaymentChoice; label: string; hint: string }[] = [
  { value: "FULL", label: "Paid Full", hint: "The whole fee is collected" },
  { value: "DISCOUNT", label: "Discount", hint: "Part is waived, the rest is collected" },
  { value: "PARTIAL", label: "Paid Partially", hint: "Part is collected, the rest is still owed" },
  { value: "FREE", label: "Free", hint: "No charge" },
];

const toNumber = (v: string | number | null | undefined): number => {
  const n = typeof v === "number" ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Tolerance so float rounding (e.g. 2999.999) never flips a state. */
const EPSILON = 0.005;

export function getPaymentStatus(input: {
  isFree?: boolean | null;
  fee?: string | number | null;
  paid?: string | number | null;
  discount?: string | number | null;
}): PaymentStatus {
  const fee = toNumber(input.fee);
  const paid = toNumber(input.paid);
  const discount = toNumber(input.discount);

  if (input.isFree || fee <= 0) return "FREE";

  const payable = Math.max(0, fee - discount);
  if (paid + EPSILON >= payable) return discount > EPSILON ? "DISCOUNT" : "PAID";
  if (paid > EPSILON) return "PARTIAL";
  return "UNPAID";
}

/** Amount still owed: fee minus what was waived minus what was collected (never negative). */
export function getBalance(
  fee: string | number | null | undefined,
  paid: string | number | null | undefined,
  discount?: string | number | null,
): number {
  return round2(Math.max(0, toNumber(fee) - toNumber(discount) - toNumber(paid)));
}

/** The status a licence currently represents, expressed as a form choice. */
export function statusToChoice(status: PaymentStatus): PaymentChoice | null {
  if (status === "PAID") return "FULL";
  if (status === "DISCOUNT") return "DISCOUNT";
  if (status === "PARTIAL") return "PARTIAL";
  if (status === "FREE") return "FREE";
  return null; // legacy Unpaid: no choice pre-selected
}

export type PaymentPlan =
  | { ok: false; error: string }
  | {
      ok: true;
      /** Whether the licence is Free (drives the stored fee = 0). */
      isFree: boolean;
      /** Waived amount to store on the licence. */
      discount: number;
      /** New money to record as a payment now (0 = nothing to record). */
      record: number;
    };

/**
 * Turn a form choice into concrete writes, validated against the category fee and
 * what has already been collected. Works for a new application (paid = 0) and for
 * an edit (records only the difference), so both flows obey identical rules.
 */
export function planPaymentChoice(input: {
  /** The category fee for this licence type (the real charge, ignoring Free). */
  fee: string | number | null | undefined;
  /** Already collected (0 for a new application). */
  paid?: string | number | null;
  choice: PaymentChoice;
  discountAmount?: string | number | null;
  partialAmount?: string | number | null;
}): PaymentPlan {
  const fee = toNumber(input.fee);
  const paid = toNumber(input.paid);

  if (input.choice === "FREE") {
    return { ok: true, isFree: true, discount: 0, record: 0 };
  }

  if (fee <= 0) {
    return { ok: false, error: "This licence category has no fee — choose Free." };
  }

  if (input.choice === "FULL") {
    return { ok: true, isFree: false, discount: 0, record: round2(Math.max(0, fee - paid)) };
  }

  if (input.choice === "DISCOUNT") {
    const discount = toNumber(input.discountAmount);
    if (!(discount > 0)) {
      return { ok: false, error: "Enter a discount amount greater than zero." };
    }
    if (discount + EPSILON >= fee) {
      return {
        ok: false,
        error: "The discount must be less than the fee — choose Free for no charge.",
      };
    }
    const payable = fee - discount;
    if (paid > payable + EPSILON) {
      return {
        ok: false,
        error: `${round2(paid).toLocaleString()} is already collected — more than the discounted price of ${round2(payable).toLocaleString()}.`,
      };
    }
    return { ok: true, isFree: false, discount: round2(discount), record: round2(payable - paid) };
  }

  // PARTIAL
  const amount = toNumber(input.partialAmount);
  const outstanding = fee - paid;
  if (!(amount > 0)) {
    return { ok: false, error: "Enter the amount being paid now." };
  }
  if (amount + EPSILON >= outstanding) {
    return {
      ok: false,
      error: "That covers the full amount owed — choose Paid Full instead.",
    };
  }
  return { ok: true, isFree: false, discount: 0, record: round2(amount) };
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Paid Full",
  DISCOUNT: "Discount",
  PARTIAL: "Paid Partially",
  FREE: "Free",
  UNPAID: "Unpaid",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  PAID: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
  DISCOUNT: "bg-violet-100 text-violet-700 hover:bg-violet-100 dark:bg-violet-900 dark:text-violet-300",
  PARTIAL: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300",
  FREE: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300",
  UNPAID: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300",
};

/** Money formatting used across the licence screens. */
export function formatMoney(v: string | number | null | undefined): string {
  return toNumber(v).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
