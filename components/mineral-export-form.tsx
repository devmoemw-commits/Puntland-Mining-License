"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  mineralExportSchema,
  type MineralExportInput,
  mineralFormValues,
  idTypeValues,
  pointOfExportValues,
  transportModeValues,
} from "@/types/export-schema";
import {
  CreateMineralExport,
  UpdateMineralExport,
} from "@/lib/actions/export.action";

export interface MineralExportFormInitialData extends MineralExportInput {
  id: string;
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">
        {title}
        {subtitle ? (
          <span className="font-normal text-muted-foreground"> — {subtitle}</span>
        ) : null}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function MineralExportForm({
  initialData,
}: {
  initialData?: MineralExportFormInitialData;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MineralExportInput>({
    resolver: zodResolver(mineralExportSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? "",
      city_region: initialData?.city_region ?? "",
      company_telephone: initialData?.company_telephone ?? "",
      mineral_licence_no: initialData?.mineral_licence_no ?? "",
      rep_full_name: initialData?.rep_full_name ?? "",
      rep_position: initialData?.rep_position ?? "",
      rep_telephone: initialData?.rep_telephone ?? "",
      rep_id_type: initialData?.rep_id_type ?? "",
      rep_id_number: initialData?.rep_id_number ?? "",
      mineral_type: initialData?.mineral_type ?? "",
      mineral_form: initialData?.mineral_form ?? "",
      quantity: initialData?.quantity ?? "",
      unit: initialData?.unit ?? "",
      extraction_site: initialData?.extraction_site ?? "",
      district_region: initialData?.district_region ?? "",
      destination_country: initialData?.destination_country ?? "",
      point_of_export_type: initialData?.point_of_export_type ?? "",
      point_of_export_name: initialData?.point_of_export_name ?? "",
      transport_mode: initialData?.transport_mode ?? "",
      vessel_or_airline_name: initialData?.vessel_or_airline_name ?? "",
      export_date: initialData?.export_date ?? "",
      applicant_name: initialData?.applicant_name ?? "",
      approver_title: initialData?.approver_title ?? "",
      approver_name: initialData?.approver_name ?? "",
    },
  });

  const onSubmit = async (values: MineralExportInput) => {
    setSubmitting(true);
    try {
      const res = isEdit
        ? await UpdateMineralExport({ id: initialData!.id, ...values })
        : await CreateMineralExport(values);

      if (res?.data?.error) {
        toast.error(String(res.data.error));
        return;
      }
      toast.success(isEdit ? "Export updated" : "Export registered");
      const newId = (res?.data as { id?: string } | undefined)?.id;
      router.push(isEdit ? `/exports/${initialData!.id}` : newId ? `/exports/${newId}` : "/exports");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    name: keyof MineralExportInput,
    labelEn: string,
    labelSo: string,
    opts?: { type?: string; placeholder?: string },
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {labelSo} <span className="text-muted-foreground">/ {labelEn}</span>
      </Label>
      <Input id={name} type={opts?.type} placeholder={opts?.placeholder} {...register(name)} />
      {errors[name] ? (
        <p className="text-xs text-red-600">{String(errors[name]?.message)}</p>
      ) : null}
    </div>
  );

  const select = (
    name: keyof MineralExportInput,
    labelEn: string,
    labelSo: string,
    options: readonly string[],
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {labelSo} <span className="text-muted-foreground">/ {labelEn}</span>
      </Label>
      <select
        id={name}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        {...register(name)}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">
          Foomka Diiwaangelinta Macdanta La Dhoofinayo
        </h1>
        <p className="text-sm text-muted-foreground">
          Mineral Export Registration Form
        </p>
      </div>

      <Section
        title="Xogta Shirkadda Dhoofinaysa"
        subtitle="Exporting Company Information"
      >
        {field("company_name", "Company Name", "Magaca Shirkadda")}
        {field("city_region", "City–Region", "Magaalada/Gobolka")}
        {field("company_telephone", "Telephone", "Taleefan")}
        {field("mineral_licence_no", "Mineral Licence No.", "Lambarka Shatiga Macdanta")}
      </Section>

      <Section
        title="Qofka Loo Idmaday Xamuulka"
        subtitle="Authorised Cargo Representative"
      >
        {field("rep_full_name", "Full Name", "Magaca oo Dhammeystiran")}
        {field("rep_position", "Position / Relationship", "Jagada ama Xiriirka")}
        {field("rep_telephone", "Telephone", "Taleefan")}
        {select("rep_id_type", "Identification Type", "Nooca Aqoonsiga", idTypeValues)}
        {field("rep_id_number", "Identification No.", "Lambarka Aqoonsiga")}
      </Section>

      <Section title="Faahfaahinta Macdanta" subtitle="Mineral Shipment Details">
        {field("mineral_type", "Type of Mineral", "Nooca Macdanta")}
        {select("mineral_form", "Form of Mineral", "Qaabka Macdanta", mineralFormValues)}
        {field("quantity", "Quantity or Weight", "Tirada ama Miisaanka")}
        {field("unit", "Unit", "Halbeegga")}
        {field("extraction_site", "Extraction Site", "Meesha Laga Soo Saaray")}
        {field("district_region", "District–Region", "Degmada/Gobolka")}
      </Section>

      <Section
        title="Meesha iyo Habka Dhoofinta"
        subtitle="Destination and Export Route"
      >
        {field("destination_country", "Destination Country", "Dalka Loo Dhoofinayo")}
        {select("point_of_export_type", "Point of Export", "Meesha Laga Dhoofinayo", pointOfExportValues)}
        {field("point_of_export_name", "Point Name", "Magaca Meesha")}
        {select("transport_mode", "Mode of Transport", "Habka Gaadiidka", transportModeValues)}
        {field("vessel_or_airline_name", "Vessel / Airline Name", "Magaca Markabka/Diyaaradda")}
        {field("export_date", "Export Date", "Taariikhda Dhoofinta", { type: "date" })}
      </Section>

      <Section title="Caddeynta & Ansixinta" subtitle="Declaration & Approval">
        {field("applicant_name", "Applicant Name", "Magaca Codsadaha")}
        {field("approver_title", "Approving Officer Title", "Jagada Ansixiyaha")}
        {field("approver_name", "Approving Officer Name", "Magaca Ansixiyaha")}
      </Section>

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Update Export" : "Register Export"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/exports")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
