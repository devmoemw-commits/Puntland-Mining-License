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
export interface SampleData extends BaseSample {
  // Add any form-specific properties here
}

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