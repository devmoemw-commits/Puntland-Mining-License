import { asc, eq } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { businessTypes } from "@/database/schema";

export type BusinessTypeRecord = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

const columns = {
  id: businessTypes.id,
  name: businessTypes.name,
  description: businessTypes.description,
  is_active: businessTypes.is_active,
  sort_order: businessTypes.sort_order,
};

/** All business types (active and inactive), for admin management screens. */
export async function listBusinessTypes(): Promise<BusinessTypeRecord[]> {
  return db
    .select(columns)
    .from(businessTypes)
    .orderBy(asc(businessTypes.sort_order), asc(businessTypes.name));
}

/** Only active business types, for application forms. */
export async function listActiveBusinessTypes(): Promise<BusinessTypeRecord[]> {
  return db
    .select(columns)
    .from(businessTypes)
    .where(eq(businessTypes.is_active, true))
    .orderBy(asc(businessTypes.sort_order), asc(businessTypes.name));
}
