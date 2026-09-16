import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import {
  approvalWorkflows,
  districts,
  licenseWorkflowInstances,
  licenseWorkflowTransitions,
  licenses,
  roles,
  users,
} from "@/database/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { License, Location } from "@/types";
import { LicenseDetailTabs } from "./_components/license-detail-tabs";
import { getCertificateAssets } from "@/lib/data/get-system-config";
import { listInspectionReports, listRenewals } from "@/lib/data/license-extras";
import { listActivityForEntity } from "@/lib/data/activity-logs";

interface Props {
  params: Promise<{ id: string }>;
}

type LicenseWorkflowView = {
  workflowName: string;
  workflowCode: string;
  currentStepNumber: number;
  isCompleted: boolean;
  /** True when every step in the definition has been executed (nothing pending). */
  allStepsCompleted: boolean;
  /** True when the workflow defines a dedicated signature step (assigned signer). */
  hasSignatureStep: boolean;
  nextStep: {
    kind: "TRANSITION" | "SIGNATURE";
    fromStatus: string;
    toStatus: string;
    allowedRoles: string[];
  } | null;
  approvalRoles: {
    code: string;
    label: string;
    userName: string | null;
    userSignatureUrl: string | null;
  }[];
  transitions: {
    id: string;
    stepNumber: number;
    fromStatus: string;
    toStatus: string;
    comment: string | null;
    createdAt: string;
    actedByName: string | null;
    actedByRole: string | null;
    actedBySignatureUrl: string | null;
    /** Roles the executed step was assigned to (from the workflow definition). */
    stepRoles: string[];
    /** True when the actor's role was not among the step's assigned roles. */
    isOverride: boolean;
  }[];
} | null;

function toIso(v: Date | string | null | undefined): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

async function getLicenseById(id: string): Promise<License | null> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const rows = await db
    .select({
      license: licenses,
      district: districts,
    })
    .from(licenses)
    .leftJoin(districts, eq(licenses.district_id, districts.id))
    .where(eq(licenses.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const { license: l, district: d } = rows[0];

  const location: Location = d
    ? {
        id: d.id,
        name: d.name,
        region_id: d.region_id,
        created_at: toIso(d.created_at),
      }
    : {
        id: "",
        name: "",
        region_id: "",
        created_at: "",
      };

  return {
    id: l.id,
    license_ref_id: l.license_ref_id,
    company_name: l.company_name,
    business_type: l.business_type,
    company_address: l.company_address ?? "",
    region: l.region ?? "",
    district_id: l.district_id,
    country_of_origin: l.country_of_origin ?? "",
    full_name: l.full_name ?? "",
    mobile_number: l.mobile_number ?? "",
    email_address: l.email_address ?? "",
    id_card_number: l.id_card_number ?? "",
    passport_photos: l.passport_photos ?? "",
    company_profile: l.company_profile ?? "",
    receipt_of_payment: l.receipt_of_payment ?? "",
    environmental_assessment_plan: l.environmental_assessment_plan ?? "",
    experience_profile: l.experience_profile ?? "",
    risk_management_plan: l.risk_management_plan ?? "",
    bank_statement: l.bank_statement ?? "",
    license_type: l.license_type ?? "",
    license_category: l.license_category ?? "",
    calculated_fee: l.calculated_fee != null ? String(l.calculated_fee) : "",
    license_area: l.license_area ?? [],
    created_at: toIso(l.created_at),
    updated_at: toIso(l.updated_at),
    expire_date: toIso(l.expire_date),
    location,
    signature: l.signature ?? false,
    signed_by_user_id: l.signed_by_user_id ?? null,
    status: l.status,
  };
}

async function getLicenseWorkflowByLicenseId(
  licenseId: string,
  currentLicenseStatus: string,
): Promise<LicenseWorkflowView> {
  let [instanceRow] = await db
    .select({
      instance: licenseWorkflowInstances,
      workflow: approvalWorkflows,
    })
    .from(licenseWorkflowInstances)
    .innerJoin(
      approvalWorkflows,
      eq(licenseWorkflowInstances.workflowId, approvalWorkflows.id),
    )
    .where(eq(licenseWorkflowInstances.licenseId, licenseId))
    .limit(1);

  if (!instanceRow) {
    const [activeWorkflow] = await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.module, "LICENSE"),
          eq(approvalWorkflows.isActive, true),
        ),
      )
      .orderBy(desc(approvalWorkflows.updatedAt))
      .limit(1);

    if (activeWorkflow) {
      try {
        await db.insert(licenseWorkflowInstances).values({
          licenseId,
          workflowId: activeWorkflow.id,
          definitionSnapshot: activeWorkflow.definition,
        });
      } catch (error) {
        console.error("Failed to backfill workflow instance:", error);
      }

      [instanceRow] = await db
        .select({
          instance: licenseWorkflowInstances,
          workflow: approvalWorkflows,
        })
        .from(licenseWorkflowInstances)
        .innerJoin(
          approvalWorkflows,
          eq(licenseWorkflowInstances.workflowId, approvalWorkflows.id),
        )
        .where(eq(licenseWorkflowInstances.licenseId, licenseId))
        .limit(1);
    }
  }

  if (!instanceRow) return null;

  const transitionRows = await db
    .select({
      transition: licenseWorkflowTransitions,
      actorName: users.name,
      actorRole: users.role,
      actorSignatureUrl: users.signatureImageUrl,
    })
    .from(licenseWorkflowTransitions)
    .leftJoin(users, eq(licenseWorkflowTransitions.actedByUserId, users.id))
    .where(eq(licenseWorkflowTransitions.instanceId, instanceRow.instance.id))
    .orderBy(desc(licenseWorkflowTransitions.createdAt));

  let approvalRoles: {
    code: string;
    label: string;
    userName: string | null;
    userSignatureUrl: string | null;
  }[] = [];
  let nextStep: {
    kind: "TRANSITION" | "SIGNATURE";
    fromStatus: string;
    toStatus: string;
    allowedRoles: string[];
  } | null = null;
  // stepNumber -> roles assigned to it, so a recorded transition can be matched back
  // to the step (and therefore the role card) it actually executed.
  const stepRolesByNumber = new Map<number, string[]>();
  let hasSignatureStep = false;
  // Default true so unparseable/legacy definitions never block certificate printing.
  let allStepsCompleted = true;
  try {
    const definitionSource =
      instanceRow.instance.definitionSnapshot ??
      instanceRow.workflow.definition;
    const definition = JSON.parse(definitionSource) as {
      steps?: Array<{
        stepNumber?: number;
        kind?: string;
        from?: string;
        to?: string;
        roles?: string[];
      }>;
    };

    if (Array.isArray(definition.steps)) {
      const ordered = definition.steps
        .slice()
        .sort((a, b) => Number(a.stepNumber ?? 0) - Number(b.stepNumber ?? 0));
      hasSignatureStep = ordered.some((s) => s.kind === "SIGNATURE");
      for (const s of ordered) {
        const num = Number(s.stepNumber ?? 0);
        const stepRoles = Array.isArray(s.roles)
          ? s.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean)
          : [];
        // Union, so legacy definitions with duplicate step numbers don't lose roles.
        stepRolesByNumber.set(
          num,
          Array.from(new Set([...(stepRolesByNumber.get(num) ?? []), ...stepRoles])),
        );
      }
      const maxStepNumber = ordered.reduce(
        (max, s) => Math.max(max, Number(s.stepNumber ?? 0)),
        0,
      );
      allStepsCompleted =
        instanceRow.instance.currentStepNumber >= maxStepNumber;
      // Roles named by the workflow, PLUS any role that actually acted on this licence.
      // A SUPER_ADMIN override is legitimate but isn't in the definition, so without this
      // union it renders no card at all — the licence reads APPROVED while every step
      // still shows "Pending / No Action Taken".
      const definedRoleCodes = ordered.flatMap((step) =>
        Array.isArray(step.roles)
          ? step.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean)
          : [],
      );
      const actedRoleCodes = transitionRows
        .map((row) => row.actorRole?.trim().toUpperCase())
        .filter((code): code is string => Boolean(code));
      const roleCodes = Array.from(
        new Set([...definedRoleCodes, ...actedRoleCodes]),
      );

      if (roleCodes.length > 0) {
        const roleRows = await db
          .select({ code: roles.code, name: roles.name })
          .from(roles)
          .where(inArray(roles.code, roleCodes));
        const labelByCode = new Map(roleRows.map((r) => [r.code, r.name]));
        const roleUsers = await db
          .select({
            role: users.role,
            name: users.name,
            signatureImageUrl: users.signatureImageUrl,
          })
          .from(users)
          .where(inArray(users.role, roleCodes));
        const userByRole = new Map<
          string,
          { name: string | null; signatureImageUrl: string | null }
        >();
        for (const user of roleUsers) {
          if (!userByRole.has(user.role)) {
            userByRole.set(user.role, {
              name: user.name ?? null,
              signatureImageUrl: user.signatureImageUrl ?? null,
            });
          }
        }

        approvalRoles = roleCodes.map((code) => ({
          code,
          label: labelByCode.get(code) ?? code.replaceAll("_", " "),
          userName: userByRole.get(code)?.name ?? null,
          userSignatureUrl: userByRole.get(code)?.signatureImageUrl ?? null,
        }));
      }

      // The next actionable step: the first pending step that STARTS at the current
      // status. Scanning for a status match (rather than only inspecting the single
      // lowest-numbered pending step) keeps the workflow usable when a definition has
      // duplicate or non-sequential step numbers — otherwise the panel dead-ends and
      // nobody, including the eligible actor, is offered an action.
      const step = ordered.find(
        (s) =>
          Number(s.stepNumber ?? 0) > instanceRow.instance.currentStepNumber &&
          String(s.from ?? "").toUpperCase() === currentLicenseStatus.toUpperCase(),
      );
      if (step) {
        const kind = step.kind === "SIGNATURE" ? "SIGNATURE" : "TRANSITION";
        nextStep = {
          kind,
          fromStatus: String(step.from ?? ""),
          // A signature step keeps the current status.
          toStatus: kind === "SIGNATURE" ? String(step.from ?? "") : String(step.to ?? ""),
          allowedRoles: Array.isArray(step.roles)
            ? step.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean)
            : [],
        };
      }
    }
  } catch {
    approvalRoles = [];
  }

  const isLegacyFrozen =
    !instanceRow.instance.definitionSnapshot &&
    instanceRow.instance.currentStepNumber > 0 &&
    instanceRow.instance.createdAt < instanceRow.workflow.updatedAt;

  return {
    workflowName: instanceRow.workflow.name,
    workflowCode: instanceRow.workflow.code,
    currentStepNumber: instanceRow.instance.currentStepNumber,
    hasSignatureStep,
    // Legacy instances frozen on an old workflow version can't progress — don't block them.
    allStepsCompleted: allStepsCompleted || isLegacyFrozen,
    isCompleted: instanceRow.instance.isCompleted || isLegacyFrozen,
    nextStep,
    approvalRoles,
    transitions: transitionRows.map((row) => {
      const stepRoles = stepRolesByNumber.get(row.transition.stepNumber) ?? [];
      const actedByRole = row.actorRole ?? null;
      return {
        id: row.transition.id,
        stepNumber: row.transition.stepNumber,
        fromStatus: row.transition.fromStatus,
        toStatus: row.transition.toStatus,
        comment: row.transition.comment ?? null,
        createdAt: toIso(row.transition.createdAt),
        actedByName:
          row.transition.actedByName ??
          row.actorName ??
          null,
        actedByRole,
        actedBySignatureUrl:
          row.transition.actedBySignatureUrl ??
          row.actorSignatureUrl ??
          null,
        stepRoles,
        // The step was executed by someone outside its assigned roles (a Super Admin override).
        isOverride:
          stepRoles.length > 0 &&
          !!actedByRole &&
          !stepRoles.includes(actedByRole.toUpperCase()),
      };
    }),
  };
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const license = await getLicenseById(id);

  if (!license) {
    return <div className="p-6">License not found</div>;
  }

  // Whether the viewing user has a profile signature (needed to sign certificates).
  const session = await auth();
  let viewerHasSignature = false;
  if (session?.user?.id) {
    const [viewer] = await db
      .select({ url: users.signatureImageUrl })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    viewerHasSignature = !!viewer?.url;
  }

  const [certificateAssets, workflow, inspections, renewals, activity] =
    await Promise.all([
      getCertificateAssets(),
      getLicenseWorkflowByLicenseId(id, license.status ?? "PENDING"),
      listInspectionReports(id),
      listRenewals(id),
      listActivityForEntity("license", id),
    ]);

  // The certificate signature always comes from a real user's profile signature:
  // an assigned signer's workflow signature step wins; otherwise whoever signed
  // the license (workflow approval or the manual signature toggle).
  let signerSignatureUrl: string | null = null;
  const signatureTransition = workflow?.transitions.find(
    (t) => t.fromStatus === t.toStatus && !!t.actedBySignatureUrl,
  );
  signerSignatureUrl = signatureTransition?.actedBySignatureUrl ?? null;

  if (!signerSignatureUrl && license.signature && license.signed_by_user_id) {
    const signer = await db
      .select({ url: users.signatureImageUrl })
      .from(users)
      .where(eq(users.id, license.signed_by_user_id))
      .limit(1);
    signerSignatureUrl = signer[0]?.url ?? null;
  }

  return (
    <LicenseDetailTabs
      license={license}
      certificateAssets={certificateAssets}
      signerSignatureUrl={signerSignatureUrl}
      workflow={workflow}
      viewerHasSignature={viewerHasSignature}
      inspections={inspections}
      renewals={renewals}
      activity={activity}
    />
  );
};

export default Page;
