import * as z from "zod"


export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string()
  .min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().min(1).optional(),
  directPermissionCodes: z.array(z.string()).optional(),
});

/** Admin edit user — password optional; if set, min 8 characters. */
export const updateUserSchema = z
  .object({
    name: z.string().min(3, { message: "Name must be at least 3 characters" }),
    email: z.string().email("Invalid email"),
    password: z.string().optional(),
    role: z.string().min(1, "Role is required"),
    directPermissionCodes: z.array(z.string()).optional(),
  })
  .refine(
    (data) =>
      !data.password ||
      data.password.length === 0 ||
      data.password.length >= 8,
    { message: "Password must be at least 8 characters", path: ["password"] },
  );


// Company Info validation schema
export const companyInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyRegistrationNumber: z.string().min(1, "Company registration number is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  businessType: z.string().min(1, "Business type is required"),
  region: z.string().min(1, "Region is required"),
  district: z.string().min(1, "District is required"),
  location: z.string().min(1, "Location is required"),
  countryOfOrigin: z.string().min(1, "Country of origin is required"),
})

// Personal Info validation schema
export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  emailAddress: z.string().min(1, "Email is required").email("Invalid email format"),
  idCardNumber: z.string().min(1, "ID card number is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  cityTown: z.string().min(1, "City/Town is required"),
  personalDistrict: z.string().min(1, "District is required"),
  personalRegion: z.string().min(1, "Region is required"),
})

// Documents validation schema (all optional)
export const documentsSchema = z.object({
  passport: z.any().optional(),
  idCard: z.any().optional(),
  companyProfile: z.any().optional(),
  paymentReceipt: z.any().optional(),
})

// License Fee and Payment validation schema
export const licensePaymentSchema = z.object({
  licenseType: z.string().min(1, "License type is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  calculatedFee: z.number().min(1, "Fee calculation is required"),
})

// Combined form validation schema
export const formSchema = z.object({
// The license reference ID is required to identify which license to update
  license_ref_id: z.string().min(1, "License reference ID is required"),

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

export type FormValues = z.infer<typeof formSchema>
