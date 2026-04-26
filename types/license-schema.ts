import * as z from "zod"

// License status enum values matching your database schema
export const licenseStatusValues = ["PENDING", "REVIEW", "APPROVED", "REJECTED"] as const

// Main license schema for registration
export const licensesSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  business_type: z.string().min(1, "Business type is required"),
  company_address: z.string().min(1, "Company address is required"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  country_of_origin: z.string().min(1, "Country of origin is required"),

  // 👉 Personal Info
  full_name: z.string().min(1, "Full name is required"),
  mobile_number: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
  email_address: z.string().min(1, "Email address is required"),
  id_card_number: z.string().min(1, "ID card number is required"),

  // 👉 Document Info
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),
  environmental_assessment_plan: z.string().optional(),
  experience_profile: z.string().optional(),
  risk_management_plan: z.string().optional(),
  bank_statement: z.string().optional(),

  // 👉 License Info
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_fee: z.string().min(1, "License fee is required"),
  license_area: z.array(z.string()).min(1, "License area is required"),
})

// Step-by-step schemas for multi-step forms
export const firstStepSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  business_type: z.string().min(1, "Business type is required"),
  company_address: z.string().min(1, "Company address is required"),
  region: z.string().min(1, "Location is required"),
  district: z.string().min(1, "District is required"),
  country_of_origin: z.string().min(1, "Country of origin is required"),
})

export const secondStepSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  mobile_number: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number (Start with +)"),
  email_address: z.string().min(1, "Email address is required"),
  id_card_number: z.string().min(1, "ID card number is required"),
})

export const thirdStepSchema = z.object({
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),
  environmental_assessment_plan: z.string().optional(),
  experience_profile: z.string().optional(),
  risk_management_plan: z.string().optional(),
  bank_statement: z.string().optional(),
})

export const fourthStepSchema = z.object({
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_fee: z.string().min(1, "License fee is required"),
  license_area: z.string().min(1, "License area is required"),
})

// Sample analysis schema
export const sampleAnalysisSchema = z.object({
  ref_id: z.string().min(1, "Reference ID is required"),

  name: z.string().min(1, "Name is required"),
  nationality: z.string().min(1, "Nationality is required"),
  passport_no: z.string().min(1, "Passport number is required"),
  mineral_type: z.string().min(1, "Mineral type is required"),
  unit: z.string().min(1, "Unit field is required"),
  amount: z.string().min(1, "Amount is required"),
})

// Delete license schema
export const deleteLicenseSchema = z.object({
  license_ref_id: z.string().min(1, "License reference ID is required"),
})

// Update license schema - all fields optional for partial updates
export const updateLicenseSchema = z.object({
  // The license ID is required to identify which license to update
  id: z.string().min(1, "License ID is required"),

  // Company Information (all optional)
  company_name: z.string().optional(),
  business_type: z.string().optional(),
  company_address: z.string().optional(),
  region: z.string().optional(),
  district_id: z.string().uuid("Invalid district ID").optional(), // Updated to match database schema
  country_of_origin: z.string().optional(),

  // Personal Information (all optional)
  full_name: z.string().optional(),
  mobile_number: z.string().optional(),
  email_address: z.string().email("Invalid email format").optional(),
  id_card_number: z.string().optional(),

  // Document Information (all optional)
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),

  // License Information (all optional)
  license_type: z.string().optional(),
  license_category: z.string().optional(),
  license_area: z.array(z.string()).optional(),
  calculated_fee: z.string().optional(),
  expire_date: z.string().optional(),

  // Status field (optional for updates)
  status: z.enum(licenseStatusValues).optional(),
})

// Schema specifically for updating license approval status
export const updateLicenseStatusSchema = z.object({
  id: z.string().uuid("Invalid license ID"),
  status: z.enum(licenseStatusValues, {
    errorMap: () => ({ message: "Status must be PENDING, REVIEW, APPROVED, or REJECTED" }),
  }),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
}).superRefine((value, ctx) => {
  if (value.status === "REVIEW" && !value.comment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["comment"],
      message: "Comment is required when moving a license to review",
    })
  }
})

// Schema for bulk status updates
export const bulkUpdateLicenseStatusSchema = z.object({
  ids: z.array(z.string().uuid("Invalid license ID")).min(1, "At least one license must be selected"),
  status: z.enum(licenseStatusValues, {
    errorMap: () => ({ message: "Status must be PENDING, REVIEW, APPROVED, or REJECTED" }),
  }),
})

// Schema for filtering licenses by status
export const licenseFilterSchema = z.object({
  approvalStatus: z.enum([...licenseStatusValues, "ALL"]).optional(),
  validityStatus: z.enum(["ACTIVE", "EXPIRED", "ALL"]).optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
})

// Schema for license status change history (if you want to implement logging)
export const licenseStatusHistorySchema = z.object({
  license_id: z.string().uuid("Invalid license ID"),
  old_status: z.enum(licenseStatusValues).nullable(),
  new_status: z.enum(licenseStatusValues),
  changed_by: z.string().uuid("Invalid user ID"),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

// Type exports for TypeScript
export type LicenseStatus = (typeof licenseStatusValues)[number]
export type CreateLicenseInput = z.infer<typeof licensesSchema>
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>
export type UpdateLicenseStatusInput = z.infer<typeof updateLicenseStatusSchema>
export type BulkUpdateLicenseStatusInput = z.infer<typeof bulkUpdateLicenseStatusSchema>
export type DeleteLicenseInput = z.infer<typeof deleteLicenseSchema>
export type LicenseFilterInput = z.infer<typeof licenseFilterSchema>
export type LicenseStatusHistoryInput = z.infer<typeof licenseStatusHistorySchema>

// Step schemas types
export type FirstStepInput = z.infer<typeof firstStepSchema>
export type SecondStepInput = z.infer<typeof secondStepSchema>
export type ThirdStepInput = z.infer<typeof thirdStepSchema>
export type FourthStepInput = z.infer<typeof fourthStepSchema>
export type SampleAnalysisInput = z.infer<typeof sampleAnalysisSchema>

// Utility function to validate license status
export const isValidLicenseStatus = (status: string): status is LicenseStatus => {
  return licenseStatusValues.includes(status as LicenseStatus)
}

// Utility function to get status display text
export const getStatusDisplayText = (status: LicenseStatus): string => {
  switch (status) {
    case "PENDING":
      return "Pending"
    case "REVIEW":
      return "In Review"
    case "APPROVED":
      return "Approved"
    case "REJECTED":
      return "Rejected"
    default:
      return status
  }
}

// Utility function to get status color class
export const getStatusColorClass = (status: LicenseStatus): string => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "REVIEW":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "APPROVED":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "REJECTED":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
  }
}




// Add this to your existing license-schema.ts file
export const updateLicenseSignatureSchema = z.object({
  id: z.string().uuid("Invalid license ID"),
  signature: z.boolean(),
})

export type UpdateLicenseSignatureInput = z.infer<typeof updateLicenseSignatureSchema>
