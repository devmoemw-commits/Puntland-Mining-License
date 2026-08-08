import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import { getMineralExportById } from "@/lib/data/exports";
import MineralExportForm from "@/components/mineral-export-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditExportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
  if (denied) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to edit exports.
      </div>
    );
  }

  const { id } = await params;
  const row = await getMineralExportById(id);
  if (!row) notFound();

  return (
    <div className="my-6">
      <MineralExportForm
        initialData={{
          id: row.id,
          company_name: row.company_name,
          city_region: row.city_region ?? "",
          company_telephone: row.company_telephone ?? "",
          mineral_licence_no: row.mineral_licence_no ?? "",
          rep_full_name: row.rep_full_name ?? "",
          rep_position: row.rep_position ?? "",
          rep_telephone: row.rep_telephone ?? "",
          rep_id_type: row.rep_id_type ?? "",
          rep_id_number: row.rep_id_number ?? "",
          mineral_type: row.mineral_type ?? "",
          mineral_form: row.mineral_form ?? "",
          quantity: row.quantity ?? "",
          unit: row.unit ?? "",
          extraction_site: row.extraction_site ?? "",
          district_region: row.district_region ?? "",
          destination_country: row.destination_country ?? "",
          point_of_export_type: row.point_of_export_type ?? "",
          point_of_export_name: row.point_of_export_name ?? "",
          transport_mode: row.transport_mode ?? "",
          vessel_or_airline_name: row.vessel_or_airline_name ?? "",
          export_date: row.export_date ? row.export_date.slice(0, 10) : "",
          applicant_name: row.applicant_name ?? "",
          approver_title: row.approver_title ?? "",
          approver_name: row.approver_name ?? "",
        }}
      />
    </div>
  );
}
