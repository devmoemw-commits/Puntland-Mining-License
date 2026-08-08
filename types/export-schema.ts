import { z } from "zod";

export const mineralFormValues = [
  "Raw",
  "Refined",
  "Crushed",
  "Packaged",
  "Other",
] as const;

export const idTypeValues = [
  "ID Card",
  "Passport",
  "Driving Licence",
  "Other",
] as const;

export const pointOfExportValues = ["Seaport", "Airport"] as const;
export const transportModeValues = ["Vessel", "Aircraft", "Other"] as const;

export const mineralExportSchema = z.object({
  // 1. Exporting company
  company_name: z.string().min(1, "Company name is required").max(255),
  city_region: z.string().max(255).optional(),
  company_telephone: z.string().max(255).optional(),
  mineral_licence_no: z.string().max(255).optional(),

  // 2. Authorised cargo representative
  rep_full_name: z.string().max(255).optional(),
  rep_position: z.string().max(255).optional(),
  rep_telephone: z.string().max(255).optional(),
  rep_id_type: z.string().max(64).optional(),
  rep_id_number: z.string().max(255).optional(),

  // 3. Mineral shipment details
  mineral_type: z.string().max(255).optional(),
  mineral_form: z.string().max(64).optional(),
  quantity: z.string().max(64).optional(),
  unit: z.string().max(64).optional(),
  extraction_site: z.string().max(255).optional(),
  district_region: z.string().max(255).optional(),

  // 4. Destination and export route
  destination_country: z.string().max(255).optional(),
  point_of_export_type: z.string().max(64).optional(),
  point_of_export_name: z.string().max(255).optional(),
  transport_mode: z.string().max(64).optional(),
  vessel_or_airline_name: z.string().max(255).optional(),
  export_date: z.string().optional(),

  // Declaration & approval
  applicant_name: z.string().max(255).optional(),
  approver_title: z.string().max(255).optional(),
  approver_name: z.string().max(255).optional(),
});

export const createMineralExportSchema = mineralExportSchema;

export const updateMineralExportSchema = mineralExportSchema.extend({
  id: z.string().uuid("Invalid export ID"),
});

export const setMineralExportStatusSchema = z.object({
  id: z.string().uuid("Invalid export ID"),
  status: z.enum(["REVIEW", "APPROVED", "REJECTED"]),
  comment: z.string().trim().max(1000).optional(),
});

export type MineralExportInput = z.infer<typeof mineralExportSchema>;
export type UpdateMineralExportInput = z.infer<typeof updateMineralExportSchema>;
export type SetMineralExportStatusInput = z.infer<
  typeof setMineralExportStatusSchema
>;
