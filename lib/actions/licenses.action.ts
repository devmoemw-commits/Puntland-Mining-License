"use server";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import {
  approvalWorkflows,
  licenses,
  licenseWorkflowInstances,
  licenseWorkflowTransitions,
  users,
} from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import {
  deleteLicenseSchema,
  licensesSchema,
  updateLicenseSchema,
  updateLicenseSignatureSchema,
  updateLicenseStatusSchema,
} from "@/types/license-schema";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireActionPermission, userHasPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";
import { dataDeletionBlockedResult } from "@/lib/data-retention";

type LicenseStatus = "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";

type WorkflowStepDefinition = {
  stepNumber: number;
  from: LicenseStatus;
  to: LicenseStatus;
  roles?: string[];
};

type WorkflowDefinition = {
  steps: WorkflowStepDefinition[];
};

const LICENSE_MODULE = "LICENSE";

function parseWorkflowDefinition(definition: string): WorkflowDefinition | null {
  try {
    const parsed = JSON.parse(definition) as { steps?: WorkflowStepDefinition[] };
    if (!Array.isArray(parsed.steps)) return null;

    const steps = parsed.steps
      .map((step) => ({
        stepNumber: Number(step.stepNumber),
        from: step.from,
        to: step.to,
        roles: Array.isArray(step.roles) ? step.roles.map((r) => String(r).trim()).filter(Boolean) : [],
      }))
      .filter(
        (step) =>
          Number.isFinite(step.stepNumber) &&
          step.stepNumber > 0 &&
          ["PENDING", "REVIEW", "APPROVED", "REJECTED"].includes(step.from) &&
          ["PENDING", "REVIEW", "APPROVED", "REJECTED"].includes(step.to),
      )
      .sort((a, b) => a.stepNumber - b.stepNumber);

    if (!steps.length) return null;
    return { steps };
  } catch {
    return null;
  }
}

async function getActiveLicenseWorkflow() {
  const [workflow] = await db
    .select()
    .from(approvalWorkflows)
    .where(
      and(
        eq(approvalWorkflows.module, LICENSE_MODULE),
        eq(approvalWorkflows.isActive, true),
      ),
    )
    .orderBy(desc(approvalWorkflows.updatedAt))
    .limit(1);
  return workflow ?? null;
}

async function ensureLicenseWorkflowInstance(licenseId: string) {
  let [instance] = await db
    .select()
    .from(licenseWorkflowInstances)
    .where(eq(licenseWorkflowInstances.licenseId, licenseId))
    .limit(1);

  if (instance) {
    const [workflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(eq(approvalWorkflows.id, instance.workflowId))
      .limit(1);
    return workflow ? { instance, workflow } : null;
  }

  const workflow = await getActiveLicenseWorkflow();
  if (!workflow) return null;

  try {
    const [created] = await db
      .insert(licenseWorkflowInstances)
      .values({
        licenseId,
        workflowId: workflow.id,
      })
      .returning();
    instance = created;
  } catch {
    const [existing] = await db
      .select()
      .from(licenseWorkflowInstances)
      .where(eq(licenseWorkflowInstances.licenseId, licenseId))
      .limit(1);
    instance = existing;
  }

  if (!instance) return null;
  return { instance, workflow };
}

export const RegisterLicense = actionClient.schema(licensesSchema).action(
  async ({
    parsedInput: {
      company_name,
      business_type,
      company_address,
      region,
      district,
      country_of_origin,

      // Personal Info
      full_name,
      mobile_number,
      email_address,
      id_card_number,

      // Document Info
      passport_photos,
      company_profile,
      receipt_of_payment,
      environmental_assessment_plan,
      experience_profile,
      risk_management_plan,
      bank_statement,

      // License Info
      license_type,
      license_category,
      license_fee,
      license_area,
    },
  }) => {
    
    // Get the user's session
    const session = await auth();

    if (!session || !session.user) {
      return redirect('/login');
    }

    const forbidden = await requireActionPermission(Permissions.LICENSE_REGISTER);
    if (forbidden) {
      return { error: forbidden };
    }

    function generateLicenseRefId(): string {
      const prefix = "WTMB";
      const now = new Date();
      const year = String(now.getFullYear()).slice(2); // 25
      const month = String(now.getMonth() + 1)
        .toString()
        .padStart(2, "0"); // 05
      const randomPart = Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit random

      return `${prefix}-${year}${month}-${randomPart}`;
    }

    const [createdLicense] = await db.insert(licenses).values({
      license_ref_id: generateLicenseRefId(),

      company_name: company_name,
      business_type: business_type,
      company_address: company_address,
      region: region,
      district_id: district,
      country_of_origin: country_of_origin,

      // Personal Info
      full_name: full_name,
      mobile_number: mobile_number,
      email_address: email_address,
      id_card_number: id_card_number,

      // Document Info
      passport_photos: passport_photos,
      company_profile: company_profile,
      receipt_of_payment: receipt_of_payment,
      environmental_assessment_plan: environmental_assessment_plan,
      experience_profile: experience_profile,
      risk_management_plan: risk_management_plan,
      bank_statement: bank_statement,

      // License Info
      license_type: license_type,
      license_category: license_category,
      license_area: license_area,
      calculated_fee: license_fee,
    }).returning({ id: licenses.id });

    if (createdLicense?.id) {
      const activeWorkflow = await getActiveLicenseWorkflow();
      if (activeWorkflow) {
        try {
          await db.insert(licenseWorkflowInstances).values({
            licenseId: createdLicense.id,
            workflowId: activeWorkflow.id,
          });
        } catch (error) {
          // Do not fail registration if workflow instance already exists or cannot be initialized.
          console.error("Failed to initialize workflow instance for license:", error);
        }
      }
    }

    return { success: "License registered successfully" };
  }
);

export const UpdateLicense = actionClient
  .schema(updateLicenseSchema)
  .action(async ({ parsedInput }) => {
    const forbidden = await requireActionPermission(Permissions.LICENSE_REGISTER);
    if (forbidden) {
      return { error: forbidden };
    }

    try {
      const { id, ...updateData } = parsedInput;

      // Remove undefined values
      const filteredUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([value]) => value !== undefined)
      );

      // Only proceed if there are fields to update
      if (Object.keys(filteredUpdateData).length === 0) {
        return { error: "No fields to update" };
      }

      // Update the license
      await db
        .update(licenses)
        .set({
          ...filteredUpdateData,
          updated_at: new Date(), // Keep as Date object since that's what the database expects
        })
        .where(eq(licenses.id, id));

      return { success: "License updated successfully" };
    } catch (error) {
      console.error("Error updating license:", error);
      return {
        error: `Failed to update license: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

// Create the delete license action
export const DeleteLicense = actionClient
  .schema(deleteLicenseSchema)
  .action(async () => {
    const forbidden = await requireActionPermission(Permissions.LICENSE_MODERATE);
    if (forbidden) {
      return { error: forbidden };
    }

    return dataDeletionBlockedResult();
  });

// Update license approval status
export const UpdateLicenseStatus = actionClient
  .schema(updateLicenseStatusSchema)
  .action(async ({ parsedInput: { id, status, comment } }) => {
    const requiredPermission =
      status === "REVIEW"
        ? Permissions.LICENSE_REVIEW
        : status === "APPROVED"
          ? Permissions.LICENSE_APPROVE
          : status === "REJECTED"
            ? Permissions.LICENSE_REJECT
            : Permissions.LICENSE_REGISTER;

    const primaryDenied = await requireActionPermission(requiredPermission);
    if (primaryDenied && requiredPermission !== Permissions.LICENSE_REGISTER) {
      const session = await auth();
      const hasLegacyModeratePermission = await userHasPermission(
        session?.user?.id,
        session?.user?.role,
        Permissions.LICENSE_MODERATE,
      );
      if (!hasLegacyModeratePermission) {
        return { error: primaryDenied };
      }
    }

    try {
      const session = await auth();
      if (!session?.user?.id) {
        return { error: "Unauthorized" };
      }
      const [current] = await db
        .select({ status: licenses.status })
        .from(licenses)
        .where(eq(licenses.id, id))
        .limit(1);

      if (!current) {
        return { error: "License not found" };
      }

      const workflowContext = await ensureLicenseWorkflowInstance(id);

      if (workflowContext) {
        const parsedDefinition = parseWorkflowDefinition(workflowContext.workflow.definition);
        if (!parsedDefinition) {
          return { error: "Workflow definition is invalid. Please fix it in settings." };
        }

        const matchingStep = parsedDefinition.steps.find(
          (step) =>
            step.from === current.status &&
            step.to === status &&
            step.stepNumber > workflowContext.instance.currentStepNumber,
        );

        if (!matchingStep) {
          return {
            error: `Transition from ${current.status} to ${status} is not allowed by active workflow`,
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

        if (status === "APPROVED") {
          const [actor] = await db
            .select({ signatureImageUrl: users.signatureImageUrl })
            .from(users)
            .where(eq(users.id, session.user.id))
            .limit(1);
          if (!actor?.signatureImageUrl) {
            return {
              error:
                "You must upload your signature in profile before approving a license.",
            };
          }
        }

        await db.transaction(async (tx) => {
          await tx
            .update(licenses)
            .set({
              status,
              review_comment:
                status === "REVIEW" || status === "REJECTED"
                  ? comment ?? null
                  : null,
              signature: status === "APPROVED" ? true : false,
              signed_by_user_id: status === "APPROVED" ? session.user.id : null,
              updated_at: new Date(),
            })
            .where(eq(licenses.id, id));

          await tx
            .update(licenseWorkflowInstances)
            .set({
              currentStepNumber: matchingStep.stepNumber,
              isCompleted: status === "APPROVED" || status === "REJECTED",
              updatedAt: new Date(),
            })
            .where(eq(licenseWorkflowInstances.id, workflowContext.instance.id));

          await tx.insert(licenseWorkflowTransitions).values({
            instanceId: workflowContext.instance.id,
            licenseId: id,
            stepNumber: matchingStep.stepNumber,
            fromStatus: current.status,
            toStatus: status,
            actedByUserId: session?.user?.id ?? null,
            comment: comment ?? null,
          });
        });
      } else {
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
          .update(licenses)
          .set({
            status,
            review_comment:
              status === "REVIEW" || status === "REJECTED"
                ? comment ?? null
                : null,
            signature: status === "APPROVED" ? true : false,
            signed_by_user_id: status === "APPROVED" ? session.user.id : null,
            updated_at: new Date(),
          })
          .where(eq(licenses.id, id));
      }

      const statusText =
        status === "PENDING"
          ? "pending"
          : status === "REVIEW"
            ? "moved to review"
          : status === "APPROVED"
            ? "approved"
            : "rejected";
      return { success: `License ${statusText} successfully` };
    } catch (error) {
      console.error("Error updating license status:", error);
      return {
        error: `Failed to update license status: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });

// Update license signature only (records which user signed — uses their profile signature image)
export const UpdateLicenseSignature = actionClient
  .schema(updateLicenseSignatureSchema)
  .action(async ({ parsedInput: { id, signature } }) => {
    const forbidden = await requireActionPermission(Permissions.LICENSE_MODERATE);
    if (forbidden) {
      return { error: forbidden };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    try {
      await db
        .update(licenses)
        .set({
          signature,
          signed_by_user_id: signature ? session.user.id : null,
          updated_at: new Date(),
        })
        .where(eq(licenses.id, id));

      const actionText = signature ? "signed" : "revoked";
      return { success: `License ${actionText} successfully` };
    } catch (error) {
      console.error("Error updating license signature:", error);
      return {
        error: `Failed to update license signature: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
