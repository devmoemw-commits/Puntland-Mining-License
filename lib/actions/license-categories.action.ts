"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { licenseCategories } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

const feeField = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, {
    message: "Fee must be a non-negative number",
  });

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().trim().max(2000).optional(),
  new_license_fee: feeField,
  renewal_fee: feeField,
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().uuid(),
});

const toggleSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

function revalidate() {
  revalidatePath("/settings/license-categories");
  revalidatePath("/licenses/create");
}

export const createLicenseCategory = actionClient
  .schema(createSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db.insert(licenseCategories).values({
        name: parsedInput.name,
        description: parsedInput.description?.trim() || null,
        new_license_fee: parsedInput.new_license_fee,
        renewal_fee: parsedInput.renewal_fee,
        is_active: parsedInput.is_active ?? true,
        sort_order: parsedInput.sort_order ?? 0,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create category";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A category with this name already exists" };
      }
      return { error: msg };
    }

    revalidate();
    return { success: "License category created" };
  });

export const updateLicenseCategory = actionClient
  .schema(updateSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db
        .update(licenseCategories)
        .set({
          name: parsedInput.name,
          description: parsedInput.description?.trim() || null,
          new_license_fee: parsedInput.new_license_fee,
          renewal_fee: parsedInput.renewal_fee,
          is_active: parsedInput.is_active ?? true,
          sort_order: parsedInput.sort_order ?? 0,
          updated_at: new Date(),
        })
        .where(eq(licenseCategories.id, parsedInput.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update category";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A category with this name already exists" };
      }
      return { error: msg };
    }

    revalidate();
    return { success: "License category updated" };
  });

/** Activate or deactivate a category (deletion is disabled by the data-retention policy). */
export const setLicenseCategoryActive = actionClient
  .schema(toggleSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db
        .update(licenseCategories)
        .set({ is_active: parsedInput.is_active, updated_at: new Date() })
        .where(eq(licenseCategories.id, parsedInput.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update category";
      return { error: msg };
    }

    revalidate();
    return {
      success: parsedInput.is_active
        ? "Category activated"
        : "Category deactivated",
    };
  });
