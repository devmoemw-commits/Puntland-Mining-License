"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/database/drizzle";
import { businessTypes } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

const createSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(255),
  description: z.string().trim().max(2000).optional(),
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
  revalidatePath("/settings/business-types");
  revalidatePath("/licenses/create");
}

export const createBusinessType = actionClient
  .schema(createSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db.insert(businessTypes).values({
        name: parsedInput.name,
        description: parsedInput.description?.trim() || null,
        is_active: parsedInput.is_active ?? true,
        sort_order: parsedInput.sort_order ?? 0,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create business type";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A business type with this name already exists" };
      }
      return { error: msg };
    }

    revalidate();
    return { success: "Business type created" };
  });

export const updateBusinessType = actionClient
  .schema(updateSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db
        .update(businessTypes)
        .set({
          name: parsedInput.name,
          description: parsedInput.description?.trim() || null,
          is_active: parsedInput.is_active ?? true,
          sort_order: parsedInput.sort_order ?? 0,
          updated_at: new Date(),
        })
        .where(eq(businessTypes.id, parsedInput.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update business type";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A business type with this name already exists" };
      }
      return { error: msg };
    }

    revalidate();
    return { success: "Business type updated" };
  });

/** Activate or deactivate a business type (deletion is disabled by the data-retention policy). */
export const setBusinessTypeActive = actionClient
  .schema(toggleSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) return { error: denied };

    try {
      await db
        .update(businessTypes)
        .set({ is_active: parsedInput.is_active, updated_at: new Date() })
        .where(eq(businessTypes.id, parsedInput.id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update business type";
      return { error: msg };
    }

    revalidate();
    return {
      success: parsedInput.is_active
        ? "Business type activated"
        : "Business type deactivated",
    };
  });
