import { z } from "zod";

// Define a schema for the delete operation
export const deleteSampleSchema = z.object({
  id: z.string()
});

// New schema for updating sample analysis
export const updateSampleAnalysisSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  nationality: z.string().min(1, "Nationality is required"),
  passport_no: z.string().min(1, "Passport number is required"),
  mineral_type: z.string().min(1, "Mineral type is required"),
  unit: z.string().min(1, "Unit amount is required"),
  amount: z.string().min(1, "Amount is required"),
})

// Shared base interface
export interface BaseSample {
  id: string
  name: string
  passport_no: string
  nationality: string
  mineral_type: string
  unit: string
  amount: string
  created_at: string
}

// Form data type (what the form component expects)
export type SampleData = BaseSample

// Database/API type (includes all database fields)
export interface TSample extends BaseSample {
  updated_at: string
  // Add any other database-specific fields here
}


// Add this to your existing license-schema.ts file
export const updateSampleSignatureSchema = z.object({
  id: z.string().uuid("Invalid Sample ID"),
  signature: z.boolean(),
})

export type UpdateSampleSignatureInput = z.infer<typeof updateSampleSignatureSchema>

// Schema for updating sample approval status (workflow-driven)
export const updateSampleStatusSchema = z
  .object({
    id: z.string().uuid("Invalid Sample ID"),
    status: z.enum(["PENDING", "REVIEW", "APPROVED", "REJECTED"], {
      errorMap: () => ({
        message: "Status must be PENDING, REVIEW, APPROVED, or REJECTED",
      }),
    }),
    comment: z
      .string()
      .trim()
      .max(1000, "Comment cannot exceed 1000 characters")
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "REJECTED" && !value.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "Comment is required when rejecting a sample",
      })
    }
  })

export type UpdateSampleStatusInput = z.infer<typeof updateSampleStatusSchema>

// Schema for signing a SIGNATURE-kind sample workflow step (does not change status)
export const signSampleWorkflowStepSchema = z.object({
  id: z.string().uuid("Invalid Sample ID"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment cannot exceed 1000 characters")
    .optional(),
})

export type SignSampleWorkflowStepInput = z.infer<typeof signSampleWorkflowStepSchema>