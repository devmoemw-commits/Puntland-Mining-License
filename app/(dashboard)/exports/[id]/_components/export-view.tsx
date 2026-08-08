"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Pencil, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LicenseStatusBadge } from "@/app/(dashboard)/licenses/_components/license-status-badge";
import { SetMineralExportStatus } from "@/lib/actions/export.action";
import type { MineralExportView } from "@/lib/data/exports";
import type { LicenseStatus } from "@/types/license-schema";

function Row({ so, en, value }: { so: string; en: string; value: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 border-b py-1.5 text-sm">
      <div className="text-muted-foreground">
        {so} <span className="opacity-70">/ {en}</span>
      </div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

export function ExportView({ data }: { data: MineralExportView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: "APPROVED" | "REJECTED") => {
    let comment: string | undefined;
    if (status === "REJECTED") {
      comment = window.prompt("Reason for rejection:")?.trim();
      if (!comment) {
        toast.error("A reason is required to reject");
        return;
      }
    }
    setBusy(true);
    const res = await SetMineralExportStatus({ id: data.id, status, comment });
    setBusy(false);
    if (res?.data?.error) {
      toast.error(String(res.data.error));
      return;
    }
    toast.success(String(res?.data?.success ?? "Updated"));
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar — hidden when printing */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Mineral Export {data.ref_id}</h1>
          <LicenseStatusBadge status={data.status as LicenseStatus} />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/exports/edit/${data.id}`}>
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Link>
          </Button>
          {(data.status === "PENDING" || data.status === "REVIEW") && (
            <>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => setStatus("APPROVED")}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-1.5 h-4 w-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => setStatus("REJECTED")}
              >
                <X className="mr-1.5 h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Printable document */}
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 text-black">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-bold">
            FOOMKA DIIWAANGELINTA MACDANTA LA DHOOFINAYO
          </h2>
          <p className="text-sm">MINERAL EXPORT REGISTRATION FORM</p>
          <p className="mt-2 font-mono text-sm">{data.ref_id}</p>
        </div>

        <h3 className="mb-1 mt-4 font-semibold">
          1. Xogta Shirkadda Dhoofinaysa / Exporting Company Information
        </h3>
        <Row so="Magaca Shirkadda" en="Company Name" value={data.company_name} />
        <Row so="Magaalada/Gobolka" en="City–Region" value={data.city_region} />
        <Row so="Taleefan" en="Telephone" value={data.company_telephone} />
        <Row so="Lambarka Shatiga Macdanta" en="Mineral Licence No." value={data.mineral_licence_no} />

        <h3 className="mb-1 mt-4 font-semibold">
          2. Qofka Loo Idmaday Xamuulka / Authorised Cargo Representative
        </h3>
        <Row so="Magaca oo Dhammeystiran" en="Full Name" value={data.rep_full_name} />
        <Row so="Jagada ama Xiriirka" en="Position / Relationship" value={data.rep_position} />
        <Row so="Taleefan" en="Telephone" value={data.rep_telephone} />
        <Row so="Nooca Aqoonsiga" en="Identification Type" value={data.rep_id_type} />
        <Row so="Lambarka Aqoonsiga" en="Identification No." value={data.rep_id_number} />

        <h3 className="mb-1 mt-4 font-semibold">
          3. Faahfaahinta Macdanta / Mineral Shipment Details
        </h3>
        <Row so="Nooca Macdanta" en="Type of Mineral" value={data.mineral_type} />
        <Row so="Qaabka Macdanta" en="Form of Mineral" value={data.mineral_form} />
        <Row
          so="Tirada ama Miisaanka"
          en="Quantity or Weight"
          value={[data.quantity, data.unit].filter(Boolean).join(" ") || null}
        />
        <Row so="Meesha Laga Soo Saaray" en="Extraction Site" value={data.extraction_site} />
        <Row so="Degmada/Gobolka" en="District–Region" value={data.district_region} />

        <h3 className="mb-1 mt-4 font-semibold">
          4. Meesha iyo Habka Dhoofinta / Destination and Export Route
        </h3>
        <Row so="Dalka Loo Dhoofinayo" en="Destination Country" value={data.destination_country} />
        <Row
          so="Meesha Laga Dhoofinayo"
          en="Point of Export"
          value={[data.point_of_export_type, data.point_of_export_name].filter(Boolean).join(" — ") || null}
        />
        <Row so="Habka Gaadiidka" en="Mode of Transport" value={data.transport_mode} />
        <Row so="Magaca Markabka/Diyaaradda" en="Vessel / Airline Name" value={data.vessel_or_airline_name} />
        <Row so="Taariikhda Dhoofinta" en="Export Date" value={fmtDate(data.export_date)} />

        <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-semibold">Caddeynta Codsadaha / Applicant’s Declaration</p>
            <p className="mt-6 border-t pt-1">{data.applicant_name || "—"}</p>
            <p className="text-xs text-muted-foreground">Magaca / Name</p>
          </div>
          <div>
            <p className="font-semibold">Ansixiyaha / Approving Officer</p>
            <p className="mt-6 border-t pt-1">
              {data.approver_name || "—"}
              {data.approver_title ? ` — ${data.approver_title}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">Saxiixa / Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
