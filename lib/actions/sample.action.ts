"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  approvalWorkflows,
  sampleAnalysis,
  sampleWorkflowInstances,
  sampleWorkflowTransitions,
  users,
} from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { sampleAnalysisSchema } from "@/types/license-schema";
import {
  deleteSampleSchema,
  signSampleWorkflowStepSchema,
  updateSampleAnalysisSchema,
  updateSampleSignatureSchema,
  updateSampleStatusSchema,
} from "@/types/sample.type";
import { desc, eq } from "drizzle-orm";
import { and, gte, lte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { dataDeletionBlockedResult } from "@/lib/data-retention";
import { parseWorkflowDefinition } from "@/lib/approval-workflow";
import { logActivity } from "@/lib/activity-log";

const SAMPLE_MODULE = "SAMPLE";

async function getActiveSampleWorkflow() {
  const [workflow] = await db
    .select()
    .from(approvalWorkflows)
    .where(
      and(
        eq(approvalWorkflows.module, SAMPLE_MODULE),
        eq(approvalWorkflows.isActive, true),
      ),
    )
    .orderBy(desc(approvalWorkflows.updatedAt))
    .limit(1);
  return workflow ?? null;
}

async function ensureSampleWorkflowInstance(sampleId: string) {
  let [instance] = await db
    .select()
    .from(sampleWorkflowInstances)
    .where(eq(sampleWorkflowInstances.sampleId, sampleId))
    .limit(1);

  if (instance) {
    const [workflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, instance.workflowId))
      .limit(1);
    return workflow ? { instance, workflow } : null;
  }

  const workflow = await getActiveSampleWorkflow();
  if (!workflow) return null;

  try {
    const [created] = await db
      .insert(sampleWorkflowInstances)
      .values({
        sampleId,
        workflowId: workflow.id,
        definitionSnapshot: workflow.definition,
      })
      .returning();
    instance = created;
  } catch {
    const [existing] = await db
      .select()
      .from(sampleWorkflowInstances)
      .where(eq(sampleWorkflowInstances.sampleId, sampleId))
      .limit(1);
    instance = existing;
  }

  if (!instance) return null;
  return { instance, workflow };
}

export const RegisterSampleAnalysis = actionClient
  .schema(sampleAnalysisSchema)
  .action(
    async ({
      parsedInput: { name, passport_no, nationality, mineral_type, unit, amount },
    }) => {
      const session = await auth();

      if (!session || !session.user) {
        return redirect("/login");
      }

      const forbidden = await requireActionPermission(
        Permissions.SAMPLE_ANALYSIS_ACCESS,
      );
      if (forbidden) {
        return { error: forbidden };
      }

      const prefix = "MOEMW/DG";
      const now = new Date();

      const year = String(now.getFullYear()).slice(2); // e.g. "25"
      const startOfYear = new Date(now.getFullYear(), 0, 1);  // Jan 1st
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31st

      // Query how many records were created this year
      const records = await db
        .select()
        .from(sampleAnalysis)
        .where(
          and(
            gte(sampleAnalysis.created_at, startOfYear),
            lte(sampleAnalysis.created_at, endOfYear)
          )
        );

      // Serial number: count + 1
      const serial = String(records.length + 1).padStart(2, "0"); // "04", "05", ...

      const ref_id = `${prefix}/${serial}/${year}`;

      const [createdSample] = await db
        .insert(sampleAnalysis)
        .values({
          ref_id,
          name,
          passport_no,
          nationality,
          mineral_type,
          unit,
          amount,
        })
        .returning({ id: sampleAnalysis.id });

      if (createdSample?.id) {
        const activeWorkflow = await getActiveSampleWorkflow();
        if (activeWorkflow) {
          try {
            await db.insert(sampleWorkflowInstances).values({
              sampleId: createdSample.id,
              workflowId: activeWorkflow.id,
              definitionSnapshot: activeWorkflow.definition,
            });
          } catch (error) {
            // Do not fail registration if workflow instance already exists or cannot be initialized.
            console.error("Failed to initialize workflow instance for sample:", error);
          }
        }

        await logActivity({
          action: "sample.create",
          entityType: "sample",
          entityId: createdSample.id,
          entityLabel: ref_id,
          summary: `Registered sample ${ref_id} for ${name}`,
        });
      }

      return { success: "Sample registered successfully" };
    }
  );

// Create the update sample action
export const UpdateSampleAnalysis = actionClient
  .schema(updateSampleAnalysisSchema)
  .action(async ({ parsedInput: { id, name, passport_no, nationality, mineral_type, unit, amount } }) => {
    const forbidden = await requireActionPermission(
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    );
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      // Update the sample analysis record where ref_id matches
      await db
        .update(sampleAnalysis)
        .set({
          name,
          passport_no,
          nationality,
          mineral_type,
          unit,
          amount,
          updated_at: new Date(), // Update the timestamp
        })
        .where(eq(sampleAnalysis.id, id));

      await logActivity({
        action: "sample.update",
        entityType: "sample",
        entityId: id,
        summary: `Updated sample details for ${name}`,
      });

      return { success: "Sample updated successfully" };
    } catch (error) {
      console.error("Error updating Sample:", error);
      return { error: "Failed to update Sample" };
    }
  });

// Create the delete license action
export const DeleteSample = actionClient
  .schema(deleteSampleSchema)
  .action(async () => {
    const forbidden = await requireActionPermission(
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    );
    if (forbidden) {
      return { error: forbidden };
    }

    return dataDeletionBlockedResult();
  });

// Get sample by ref_id
export const GetSampleByRefId = async (ref_id: string) => {
  try {
    const sample = await db
      .select()
      .from(sampleAnalysis)
      .where(eq(sampleAnalysis.ref_id, ref_id))
      .limit(1);

    return sample.length > 0 ? sample[0] : null;
  } catch (error) {
    console.error("Error fetching sample:", error);
    return null;
  }
};


// Update Sample Analysis Signature
export const UpdateSampleSignature = actionClient
  .schema(updateSampleSignatureSchema)
  .action(async ({ parsedInput: { id, signature } }) => {
    const forbidden = await requireActionPermission(Permissions.SAMPLE_SIGNATURE);
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      console.log("Updating Sample signature with ID:", id)
      console.log("New signature status:", signature)

      // Update only the signature field
      await db
        .update(sampleAnalysis)
        .set({
          signature: signature,
          updated_at: new Date(),
        })
        .where(eq(sampleAnalysis.id, id))

      const actionText = signature ? "signed" : "revoked"
      return { success: `Sample ${actionText} successfully` }
    } catch (error) {
      console.error("Error updating Sample signature:", error)
      return { error: `Failed to update Sample signature: ${error instanceof Error ? error.message : String(error)}` }
    }
  })

// Update sample approval status (workflow-driven, mirrors UpdateLicenseStatus)
export const UpdateSampleStatus = actionClient
  .schema(updateSampleStatusSchema)
  .action(async ({ parsedInput: { id, status, comment } }) => {
    const forbidden = await requireActionPermission(
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    );
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { error: "Unauthorized" };
      }

      const [current] = await db
        .select({ status: sampleAnalysis.status, ref: sampleAnalysis.ref_id })
        .from(sampleAnalysis)
        .where(eq(sampleAnalysis.id, id))
        .limit(1);

      if (!current) {
        return { error: "Sample not found" };
      }

      // Samples never enter administrative/draft statuses, but the shared enum includes them.
      if (
        current.status === "SUSPENDED" ||
        current.status === "CANCELLED" ||
        current.status === "DRAFT"
      ) {
        return {
          error: `This sample is ${current.status.toLowerCase()} and cannot be changed.`,
        };
      }

      const workflowContext = await ensureSampleWorkflowInstance(id);

      if (workflowContext) {
        const definitionSource =
          workflowContext.instance.definitionSnapshot ??
          workflowContext.workflow.definition;
        const parsedDefinition = parseWorkflowDefinition(definitionSource);
        if (!parsedDefinition) {
          return { error: "Workflow definition is invalid. Please fix it in settings." };
        }

        const matchingStep = parsedDefinition.steps.find(
          (step) =>
            step.kind === "TRANSITION" &&
            step.from === current.status &&
            step.to === status &&
            step.stepNumber > workflowContext.instance.currentStepNumber,
        );

        if (!matchingStep) {
          return {
            error: `Transition from ${current.status} to ${status} is not allowed by active workflow`,
          };
        }

        // Enforce ordering: a pending signature step at this status that comes
        // before the chosen transition must be signed first.
        const pendingSignatureBefore = parsedDefinition.steps.find(
          (step) =>
            step.kind === "SIGNATURE" &&
            step.from === current.status &&
            step.stepNumber > workflowContext.instance.currentStepNumber &&
            step.stepNumber < matchingStep.stepNumber,
        );
        if (pendingSignatureBefore) {
          return {
            error: "A required signature step must be completed before this action.",
          };
        }

        if (matchingStep.roles?.length) {
          const actorRole = session?.user?.role ?? null;
          if (!actorRole || !matchingStep.roles.includes(actorRole)) {
            return {
              error: `Role ${actorRole ?? "UNKNOWN"} is not allowed for this workflow step`,
            };
          }
        }

        const [actor] = await db
          .select({
            signatureImageUrl: users.signatureImageUrl,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1);

        if ((status === "REVIEW" || status === "APPROVED") && !actor?.signatureImageUrl) {
          return {
            error:
              "You must upload your signature in profile before taking this action.",
          };
        }

        if (!actor?.name?.trim()) {
          return {
            error: "Please set your full name in profile before taking workflow actions.",
          };
        }

        // Neon HTTP driver does not support interactive transactions.
        await db
          .update(sampleAnalysis)
          .set({
            status,
            review_comment:
              status === "REVIEW" || status === "REJECTED"
                ? comment ?? null
                : null,
            signature: status === "APPROVED" ? true : false,
            updated_at: new Date(),
          })
          .where(eq(sampleAnalysis.id, id));

        await db
          .update(sampleWorkflowInstances)
          .set({
            currentStepNumber: matchingStep.stepNumber,
            isCompleted: status === "APPROVED" || status === "REJECTED",
            updatedAt: new Date(),
          })
          .where(eq(sampleWorkflowInstances.id, workflowContext.instance.id));

        await db.insert(sampleWorkflowTransitions).values({
          instanceId: workflowContext.instance.id,
          sampleId: id,
          stepNumber: matchingStep.stepNumber,
          fromStatus: current.status,
          toStatus: status,
          actedByUserId: session?.user?.id ?? null,
          actedByName: actor.name.trim(),
          actedBySignatureUrl: actor?.signatureImageUrl ?? null,
          comment: comment ?? null,
        });
      } else {
        // No SAMPLE workflow configured — fall back to a fixed lifecycle.
        const allowedTransitions: Record<
          "PENDING" | "REVIEW" | "APPROVED" | "REJECTED",
          readonly ("PENDING" | "REVIEW" | "APPROVED" | "REJECTED")[]
        > = {
          PENDING: ["REVIEW"],
          REVIEW: ["APPROVED", "REJECTED"],
          APPROVED: [],
          REJECTED: [],
        };

        if (!allowedTransitions[current.status].includes(status)) {
          return {
            error: `Invalid transition from ${current.status} to ${status}`,
          };
        }

        await db
          .update(sampleAnalysis)
          .set({
            status,
            review_comment:
              status === "REVIEW" || status === "REJECTED"
                ? comment ?? null
                : null,
            signature: status === "APPROVED" ? true : false,
            updated_at: new Date(),
          })
          .where(eq(sampleAnalysis.id, id));
      }

      const statusText =
        status === "PENDING"
          ? "pending"
          : status === "REVIEW"
            ? "moved to review"
            : status === "APPROVED"
              ? "approved"
              : "rejected";

      await logActivity({
        action: "sample.status_change",
        entityType: "sample",
        entityId: id,
        entityLabel: current.ref,
        summary: `Sample ${current.ref} ${statusText}`,
        metadata: { from: current.status, to: status, comment: comment ?? null },
      });

      return { success: `Sample ${statusText} successfully` };
    } catch (error) {
      console.error("Error updating sample status:", error);
      return {
        error: `Failed to update sample status: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

// Complete a SIGNATURE-kind sample workflow step: records the acting user's
// signature and advances the workflow without changing the sample status.
export const SignSampleWorkflowStep = actionClient
  .schema(signSampleWorkflowStepSchema)
  .action(async ({ parsedInput: { id, comment } }) => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    try {
      const [current] = await db
        .select({ status: sampleAnalysis.status })
        .from(sampleAnalysis)
        .where(eq(sampleAnalysis.id, id))
        .limit(1);

      if (!current) {
        return { error: "Sample not found" };
      }

      const workflowContext = await ensureSampleWorkflowInstance(id);
      if (!workflowContext) {
        return { error: "No active workflow is configured for samples." };
      }

      const definitionSource =
        workflowContext.instance.definitionSnapshot ??
        workflowContext.workflow.definition;
      const parsedDefinition = parseWorkflowDefinition(definitionSource);
      if (!parsedDefinition) {
        return { error: "Workflow definition is invalid. Please fix it in settings." };
      }

      // The immediate next step (by number) must be a signature step at the current status.
      const nextPending = parsedDefinition.steps.find(
        (step) => step.stepNumber > workflowContext.instance.currentStepNumber,
      );
      if (
        !nextPending ||
        nextPending.kind !== "SIGNATURE" ||
        nextPending.from !== current.status
      ) {
        return { error: "There is no signature step to complete at this stage." };
      }

      // Role gate: the actor must be allowed for this step. If no roles are set on
      // the step, fall back to requiring the sample signature permission.
      const actorRole = session.user.role ?? null;
      if (nextPending.roles?.length) {
        if (!actorRole || !nextPending.roles.includes(actorRole)) {
          return {
            error: `Role ${actorRole ?? "UNKNOWN"} is not allowed to sign this step`,
          };
        }
      } else {
        const denied = await requireActionPermission(Permissions.SAMPLE_SIGNATURE);
        if (denied) return { error: denied };
      }

      const [actor] = await db
        .select({ signatureImageUrl: users.signatureImageUrl, name: users.name })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);

      if (!actor?.signatureImageUrl) {
        return {
          error: "You must upload your signature in profile before signing.",
        };
      }
      if (!actor?.name?.trim()) {
        return {
          error: "Please set your full name in profile before signing.",
        };
      }

      // Record the signature (status unchanged) and advance the workflow step.
      await db
        .update(sampleAnalysis)
        .set({
          signature: true,
          updated_at: new Date(),
        })
        .where(eq(sampleAnalysis.id, id));

      await db
        .update(sampleWorkflowInstances)
        .set({
          currentStepNumber: nextPending.stepNumber,
          updatedAt: new Date(),
        })
        .where(eq(sampleWorkflowInstances.id, workflowContext.instance.id));

      await db.insert(sampleWorkflowTransitions).values({
        instanceId: workflowContext.instance.id,
        sampleId: id,
        stepNumber: nextPending.stepNumber,
        fromStatus: current.status,
        toStatus: current.status,
        actedByUserId: session.user.id,
        actedByName: actor.name.trim(),
        actedBySignatureUrl: actor.signatureImageUrl,
        comment: comment ?? null,
      });

      return { success: "Signature recorded successfully" };
    } catch (error) {
      console.error("Error signing sample workflow step:", error);
      return {
        error: `Failed to sign workflow step: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
