"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
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

    const [existingByModule] = await db
      .select({ id: approvalWorkflows.id })
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.module, parsedInput.module))
      .limit(1);
    if (existingByModule) {
      return { error: `A workflow for module "${parsedInput.module}" already exists.` };
    }

    try {
      await db.insert(approvalWorkflows).values({
        module: parsedInput.module,
        // Keep legacy `code` column populated for backward compatibility.
        code: parsedInput.module,
        name: parsedInput.name.trim(),
        description: parsedInput.description?.trim() || null,
        definition: parsedInput.definition.trim(),
        isActive: parsedInput.isActive ?? true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create approval workflow";
      const causeCode =
        e && typeof e === "object" && "cause" in e
          ? (e as { cause?: { code?: string } }).cause?.code
          : undefined;
      if (
        causeCode === "23505" ||
        String(msg).toLowerCase().includes("unique") ||
        String(msg).toLowerCase().includes("duplicate")
      ) {
        return { error: "A workflow for this module already exists" };
      }
      return { error: "Failed to create approval workflow. Please check your inputs and try again." };
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
    const [existingByModule] = await db
      .select({ id: approvalWorkflows.id })
      .from(approvalWorkflows)
      .where(and(eq(approvalWorkflows.module, rest.module), ne(approvalWorkflows.id, id)))
      .limit(1);
    if (existingByModule) {
      return { error: `A workflow for module "${rest.module}" already exists.` };
    }

    try {
      await db
        .update(approvalWorkflows)
        .set({
          module: rest.module,
          // Keep legacy `code` column in sync with module.
          code: rest.module,
          name: rest.name.trim(),
          description: rest.description?.trim() || null,
          definition: rest.definition.trim(),
          isActive: rest.isActive ?? true,
          updatedAt: new Date(),
        })
        .where(eq(approvalWorkflows.id, id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update approval workflow";
      const causeCode =
        e && typeof e === "object" && "cause" in e
          ? (e as { cause?: { code?: string } }).cause?.code
          : undefined;
      if (
        causeCode === "23505" ||
        String(msg).toLowerCase().includes("unique") ||
        String(msg).toLowerCase().includes("duplicate")
      ) {
        return { error: "A workflow for this module already exists" };
      }
      return { error: "Failed to update approval workflow. Please check your inputs and try again." };
    }

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
