import * as z from "zod";

export const licensesSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  business_type: z.string().min(1, "Business type is required"),
  company_address: z.string().min(1, "Company address is required"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  country_of_origin: z.string().min(1, "Country of origin is required"),

  // 👉 Personal Info
  full_name: z.string().min(1, "Full name is required"),
  mobile_number: z.string().min(1, "Mobile number is required"),
  email_address: z.string().min(1, "Email address is required"),
  id_card_number: z.string().min(1, "ID card number is required"),

  // 👉 Document Info
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),


  // 👉 License Info
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_fee: z.string().min(1, "License fee is required"),
  license_area: z.string().min(1, "License area is required"),
});


export const firstStepSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  business_type: z.string().min(1, "Business type is required"),
  company_address: z.string().min(1, "Company address is required"),
  region: z.string().min(1, "Location is required"),
  district: z.string().min(1, "District is required"),
  country_of_origin: z.string().min(1, "Country of origin is required"),
});

export const secondStepSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  mobile_number: z.string().min(1, "Mobile number is required"),
  email_address: z.string().min(1, "Email address is required"),
  id_card_number: z.string().min(1, "ID card number is required")
});

export const thirdStepSchema = z.object({
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional()
});

export const fourthStepSchema = z.object({
  license_type: z.string().min(1),
  license_category: z.string().min(1),
  license_fee: z.string().min(1),
  license_area: z.string().min(1)
});



export const sampleAnalysisSchema = z.object({
  ref_id: z.string().min(1),
  name: z.string().min(1),
  passport_no: z.string().min(1),
  kilo_gram: z.string().min(1)
});


// Define a schema for the delete operation
export const deleteLicenseSchema = z.object({
  license_ref_id: z.string().min(1, "License reference ID is required")
});

// Define a schema for the update operation
// We make all fields optional since we only want to update specific fields
export const updateLicenseSchema = z.object({
  // The license ID is required to identify which license to update
  id: z.string().min(1, "License ID is required"),

  // Company Information (all optional)
  company_name: z.string().optional(),
  business_type: z.string().optional(),
  company_address: z.string().optional(),
  region: z.string().optional(),
  district: z.string().optional(),
  country_of_origin: z.string().optional(),

  // Personal Information (all optional)
  full_name: z.string().optional(),
  mobile_number: z.string().optional(),
  email_address: z.string().email().optional(),
  id_card_number: z.string().optional(),

  // Document Information (all optional)
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),

  // License Information (all optional)
  license_type: z.string().optional(),
  license_category: z.string().optional(),
  license_area: z.string().optional(),
  calculated_fee: z.string().optional(),
  expire_date: z.string().optional(),
})


