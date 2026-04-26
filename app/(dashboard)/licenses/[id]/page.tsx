import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/database/drizzle";
import { districts, licenses, users } from "@/database/schema";
import { eq } from "drizzle-orm";
import type { License, Location } from "@/types";
import LicenseDetails from "@/components/license-details";
import { getCertificateAssets } from "@/lib/data/get-system-config";

interface Props {
  params: Promise<{ id: string }>;
}

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

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const [license, certificateAssets] = await Promise.all([
    getLicenseById(id),
    getCertificateAssets(),
  ]);

  if (!license) {
    return <div className="p-6">License not found</div>;
  }

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
    />
  );
};

export default Page;
