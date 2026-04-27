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
import LicenseDetails from "@/components/license-details";
import { getCertificateAssets } from "@/lib/data/get-system-config";

interface Props {
  params: Promise<{ id: string }>;
}

type LicenseWorkflowView = {
  workflowName: string;
  workflowCode: string;
  currentStepNumber: number;
  isCompleted: boolean;
  nextStep: {
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
    fromStatus: string;
    toStatus: string;
    allowedRoles: string[];
  } | null = null;
  try {
    const definitionSource =
      instanceRow.instance.definitionSnapshot ??
      instanceRow.workflow.definition;
    const definition = JSON.parse(definitionSource) as {
      steps?: Array<{
        stepNumber?: number;
        from?: string;
        to?: string;
        roles?: string[];
      }>;
    };

    if (Array.isArray(definition.steps)) {
      const ordered = definition.steps
        .slice()
        .sort((a, b) => Number(a.stepNumber ?? 0) - Number(b.stepNumber ?? 0));
      const roleCodes = Array.from(
        new Set(
          ordered.flatMap((step) =>
            Array.isArray(step.roles)
              ? step.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean)
              : [],
          ),
        ),
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

      const step = ordered.find(
        (s) =>
          String(s.from ?? "").toUpperCase() ===
            currentLicenseStatus.toUpperCase() &&
          Number(s.stepNumber ?? 0) > instanceRow.instance.currentStepNumber,
      );
      if (step) {
        nextStep = {
          fromStatus: String(step.from ?? ""),
          toStatus: String(step.to ?? ""),
          allowedRoles: Array.isArray(step.roles)
            ? step.roles.map((r) => String(r).trim().toUpperCase()).filter(Boolean)
            : [],
        };
      }
    }
  } catch {
    approvalRoles = [];
  }

  return {
    workflowName: instanceRow.workflow.name,
    workflowCode: instanceRow.workflow.code,
    currentStepNumber: instanceRow.instance.currentStepNumber,
    isCompleted:
      instanceRow.instance.isCompleted ||
      (!instanceRow.instance.definitionSnapshot &&
        instanceRow.instance.currentStepNumber > 0 &&
        instanceRow.instance.createdAt < instanceRow.workflow.updatedAt),
    nextStep,
    approvalRoles,
    transitions: transitionRows.map((row) => ({
      id: row.transition.id,
      stepNumber: row.transition.stepNumber,
      fromStatus: row.transition.fromStatus,
      toStatus: row.transition.toStatus,
      comment: row.transition.comment ?? null,
      createdAt: toIso(row.transition.createdAt),
      actedByName: null,
      actedByRole: row.actorRole ?? null,
      actedBySignatureUrl:
        row.transition.actedBySignatureUrl ??
        row.actorSignatureUrl ??
        null,
    })),
  };
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const license = await getLicenseById(id);

  if (!license) {
    return <div className="p-6">License not found</div>;
  }

  const [certificateAssets, workflow] = await Promise.all([
    getCertificateAssets(),
    getLicenseWorkflowByLicenseId(id, license.status ?? "PENDING"),
  ]);

  let signerSignatureUrl: string | null = null;
  if (license.signature && license.signed_by_user_id) {
    const signer = await db
      .select({ url: users.signatureImageUrl })
      .from(users)
      .where(eq(users.id, license.signed_by_user_id))
      .limit(1);
    signerSignatureUrl = signer[0]?.url ?? null;
  }

  return (
    <LicenseDetails
      license={license}
      certificateAssets={certificateAssets}
      signerSignatureUrl={signerSignatureUrl}
      workflow={workflow}
    />
  );
};

export default Page;
