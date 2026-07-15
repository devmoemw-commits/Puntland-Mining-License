import dotenv from "dotenv";
import { inArray } from "drizzle-orm";

dotenv.config({ path: ".env.local" });
dotenv.config();

const LICENSE_REF_IDS = ["WTMB-2604-2807488281", "WTMB-2604-9764026582"] as const;

async function main() {
  // Important: load env first, then import db (it reads DATABASE_URL at import time).
  const [{ db }, { licenses }] = await Promise.all([
    import("@/database/drizzle"),
    import("@/database/schema"),
  ]);

  const rows = await db
    .select({
      id: licenses.id,
      license_ref_id: licenses.license_ref_id,
      company_name: licenses.company_name,
      status: licenses.status,
      created_at: licenses.created_at,
    })
    .from(licenses)
    .where(inArray(licenses.license_ref_id, [...LICENSE_REF_IDS]));

  console.log("Matched rows:", rows.length);
  for (const row of rows) console.log(row);

  if (!rows.length) {
    console.log("Nothing to delete.");
    return;
  }

  const deleted = await db
    .delete(licenses)
    .where(inArray(licenses.license_ref_id, [...LICENSE_REF_IDS]))
    .returning({ id: licenses.id, license_ref_id: licenses.license_ref_id });

  console.log("Deleted rows:", deleted.length);
  for (const row of deleted) console.log(row);

  const remaining = await db
    .select({ count: licenses.id })
    .from(licenses)
    .where(inArray(licenses.license_ref_id, [...LICENSE_REF_IDS]));

  console.log("Remaining matches after delete:", remaining.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

