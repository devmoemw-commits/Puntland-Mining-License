"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/database/drizzle";
import { approvalWorkflows } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";

const workflowSchema = z.object({
  module: z
    .string()
    .min(2, "Module is required")
    .max(64)
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => /^[A-Z][A-Z0-9_]*$/.test(s), {
      message: "Use UPPER_SNAKE_CASE (e.g. LICENSE)",
    }),
  code: z
    .string()
    .min(2)
    .max(64)
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => /^[A-Z][A-Z0-9_]*$/.test(s), {
      message: "Use UPPER_SNAKE_CASE (e.g. LICENSE_DEFAULT)",
    }),
  name: z.string().min(2).max(255),
  description: z.string().max(2000).optional(),
  definition: z.string().min(2),
  isActive: z.boolean().optional(),
});

export const createApprovalWorkflow = actionClient
  .schema(workflowSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.APPROVAL_WORKFLOW_CREATE);
    if (denied) return { error: denied };

    try {
      await db.insert(approvalWorkflows).values({
        module: parsedInput.module,
        code: parsedInput.code,
        name: parsedInput.name.trim(),
        description: parsedInput.description?.trim() || null,
        definition: parsedInput.definition.trim(),
        isActive: parsedInput.isActive ?? true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create approval workflow";
      if (String(msg).includes("unique") || String(msg).includes("duplicate")) {
        return { error: "A workflow with this code already exists" };
      }
      return { error: String(msg) };
    }

    revalidatePath("/settings/approval-workflows");
    return { success: true as const };
  });

const updateSchema = workflowSchema.extend({
  id: z.string().uuid(),
});

export const updateApprovalWorkflow = actionClient
  .schema(updateSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.APPROVAL_WORKFLOW_EDIT);
    if (denied) return { error: denied };

    const { id, ...rest } = parsedInput;
    await db
      .update(approvalWorkflows)
      .set({
        module: rest.module,
        code: rest.code,
        name: rest.name.trim(),
        description: rest.description?.trim() || null,
        definition: rest.definition.trim(),
        isActive: rest.isActive ?? true,
        updatedAt: new Date(),
      })
      .where(eq(approvalWorkflows.id, id));

    revalidatePath("/settings/approval-workflows");
    return { success: true as const };
  });

export const deleteApprovalWorkflow = actionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.APPROVAL_WORKFLOW_DELETE);
    if (denied) return { error: denied };

    await db.delete(approvalWorkflows).where(eq(approvalWorkflows.id, parsedInput.id));
    revalidatePath("/settings/approval-workflows");
    return { success: true as const };
  });
