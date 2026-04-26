"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/database/drizzle";
import { systemConfig } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { SYSTEM_CONFIG_KEYS } from "@/lib/system-config-keys";

const optionalUrl = z
  .string()
  .trim()
  .refine((s) => s === "" || z.string().url().safeParse(s).success, {
    message: "Must be a valid URL or empty",
  });

const updateSchema = z.object({
  ministerStampUrl: optionalUrl,
});

export const updateSystemSettings = actionClient
  .schema(updateSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.SYSTEM_SETTINGS);
    if (denied) {
      return { error: denied };
    }

    const entries: { key: string; value: string | null }[] = [
      {
        key: SYSTEM_CONFIG_KEYS.MINISTER_STAMP_URL,
        value: parsedInput.ministerStampUrl || null,
      },
    ];

    for (const { key, value } of entries) {
      const stored = value === null || value === "" ? null : value;
      await db
        .insert(systemConfig)
        .values({ configKey: key, value: stored, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemConfig.configKey,
          set: {
            value: stored,
            updatedAt: new Date(),
          },
        });
    }

    revalidatePath("/settings");
    revalidatePath("/licenses");

    return { success: true as const };
  });
