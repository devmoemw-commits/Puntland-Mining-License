"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/database/drizzle";
import { approvalWorkflows } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";

const VALID_STATUSES = ["PENDING", "REVIEW", "APPROVED", "REJECTED"];

/**
 * Structural validation of the workflow definition JSON. Without this the column
 * accepted any string, which is how a workflow ended up with three steps all
 * numbered 1 (making the step order ambiguous and the workflow unrunnable).
 */
function validateDefinition(definition: string, ctx: z.RefinementCtx) {
  const fail = (message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["definition"], message });

  let parsed: unknown;
  try {
    parsed = JSON.parse(definition);
  } catch {
    fail("Workflow definition must be valid JSON");
    return;
  }

  const steps = (parsed as { steps?: unknown } | null)?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    fail("Add at least one workflow step");
    return;
  }

  const counts = new Map<number, number>();

  steps.forEach((raw, index) => {
    const step = (raw ?? {}) as {
      stepNumber?: unknown;
      kind?: unknown;
      from?: unknown;
      to?: unknown;
    };

    const num = Number(step.stepNumber);
    if (!Number.isInteger(num) || num < 1) {
      fail(`Step ${index + 1}: step number must be a whole number of 1 or more`);
      return;
    }
    counts.set(num, (counts.get(num) ?? 0) + 1);

    const from = String(step.from ?? "").toUpperCase();
    if (!VALID_STATUSES.includes(from)) {
      fail(`Step ${num}: "from" status is invalid`);
      return;
    }

    // A signature step deliberately keeps the same status; a transition must move.
    if (step.kind !== "SIGNATURE") {
      const to = String(step.to ?? "").toUpperCase();
      if (!VALID_STATUSES.includes(to)) {
        fail(`Step ${num}: "to" status is invalid`);
      } else if (to === from) {
        fail(
          `Step ${num}: a status change must move to a different status (got ${from} to ${to})`,
        );
      }
    }
  });

  const duplicates = Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([num]) => num)
    .sort((a, b) => a - b);

  if (duplicates.length > 0) {
    fail(
      `Duplicate step number${duplicates.length > 1 ? "s" : ""}: ${duplicates.join(", ")}. Each step needs a unique number so the order is unambiguous.`,
    );
  }
}

const workflowBase = z.object({
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

const workflowSchema = workflowBase.superRefine((value, ctx) =>
  validateDefinition(value.definition, ctx),
);

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

const updateSchema = workflowBase
  .extend({ id: z.string().uuid() })
  .superRefine((value, ctx) => validateDefinition(value.definition, ctx));

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
