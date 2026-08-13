import { asc } from "drizzle-orm";
import { eq } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { licenseCategories } from "@/database/schema";

export type LicenseCategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  new_license_fee: string;
  renewal_fee: string;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
};

/** All categories (active and inactive), for admin management screens. */
export async function listLicenseCategories(): Promise<LicenseCategoryRecord[]> {
  return db
    .select({
      id: licenseCategories.id,
      name: licenseCategories.name,
      description: licenseCategories.description,
      new_license_fee: licenseCategories.new_license_fee,
      renewal_fee: licenseCategories.renewal_fee,
      is_free: licenseCategories.is_free,
      is_active: licenseCategories.is_active,
      sort_order: licenseCategories.sort_order,
    })
    .from(licenseCategories)
    .orderBy(asc(licenseCategories.sort_order), asc(licenseCategories.name));
}

/** Only active categories, for application forms. */
export async function listActiveLicenseCategories(): Promise<
  LicenseCategoryRecord[]
> {
  return db
    .select({
      id: licenseCategories.id,
      name: licenseCategories.name,
      description: licenseCategories.description,
      new_license_fee: licenseCategories.new_license_fee,
      renewal_fee: licenseCategories.renewal_fee,
      is_free: licenseCategories.is_free,
      is_active: licenseCategories.is_active,
      sort_order: licenseCategories.sort_order,
    })
    .from(licenseCategories)
    .where(eq(licenseCategories.is_active, true))
    .orderBy(asc(licenseCategories.sort_order), asc(licenseCategories.name));
}
