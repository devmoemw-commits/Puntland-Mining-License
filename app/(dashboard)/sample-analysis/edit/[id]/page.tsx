import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { sampleAnalysis } from "@/database/schema";
import { eq } from "drizzle-orm";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import SampleForm from "@/components/sample-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSamplePage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const denied = await requireActionPermission(Permissions.SAMPLE_ANALYSIS_ACCESS);
  if (denied) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to edit samples.
      </div>
    );
  }

  const { id } = await params;
  const [sample] = await db
    .select()
    .from(sampleAnalysis)
    .where(eq(sampleAnalysis.id, id))
    .limit(1);

  if (!sample) notFound();

  return (
    <SampleForm
      initialData={{
        id: sample.id,
        ref_id: sample.ref_id,
        name: sample.name,
        nationality: sample.nationality,
        passport_no: sample.passport_no,
        amount: String(sample.amount ?? ""),
        unit: sample.unit,
        mineral_type: sample.mineral_type,
      }}
    />
  );
}
