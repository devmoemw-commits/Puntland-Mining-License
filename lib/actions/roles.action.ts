"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/database/drizzle";
import { roles } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { dataDeletionBlockedResult } from "@/lib/data-retention";

const createSchema = z.object({
  code: z
    .string()
    .min(2)
    .max(64)
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => /^[A-Z][A-Z0-9_]*$/.test(s), {
      message: "Use UPPER_SNAKE_CASE (e.g. FIELD_AGENT)",
    }),
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
});

export const createRole = actionClient
  .schema(createSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.USERS_MANAGE);
    if (denied) return { error: denied };

    try {
      await db.insert(roles).values({
        code: parsedInput.code,
        name: parsedInput.name.trim(),
        description: parsedInput.description?.trim() || null,
        isSystem: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create role";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A role with this code already exists" };
      }
      return { error: msg };
    }

    revalidatePath("/users");
    return { success: true as const };
  });

const deleteSchema = z.object({
  code: z.string().min(1),
});

export const deleteRole = actionClient
  .schema(deleteSchema)
  .action(async ({ parsedInput: _parsedInput }) => {
    const denied = await requireActionPermission(Permissions.USERS_MANAGE);
    if (denied) return { error: denied };

    return dataDeletionBlockedResult();
  });
