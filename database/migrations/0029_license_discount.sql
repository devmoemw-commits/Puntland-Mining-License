-- Discounts: the portion of the category fee that is waived (not owed, not collected).
-- ADDITIVE ONLY. Existing licences start with no discount.
ALTER TABLE "licenses" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10, 2) NOT NULL DEFAULT 0;
