import { DefaultSession } from "next-auth";

interface AuthCredentials {
  name: string;
  email: string;
  password: string;
  /** When creating users from admin UI; defaults to OFFICER in the action if omitted. */
  role?: string;
  /** Extra permissions stored in `user_permissions` (union with role permissions). */
  directPermissionCodes?: string[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["CUSTOMER"];
  }

  interface User extends DefaultUser {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
}

export type LicenseType = {
  // Company Info
  id: string;
  companyName: string;
  companyAddress: string;
  businessType: string;
  region: string;
  district: string;
  location: string;
  countryOfOrigin: string;

  // Personal Info
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  idCardNumber: string;
  streetAddress: string;
  cityTown: string;
  personalDistrict: string;
  personalRegion: string;

  // Documents (Uploaded Files)
  passportFile: File | null;
  idCardFile: File | null;
  companyProfileFile: File | null;
  paymentReceiptFile: File | null;

  // License and Payment
  licenseType: string;
  licenseCategory: string;
  calculatedFee: number;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  licenseArea: string;
};

export type FormFiles = {
  passportFile: File | null;
  idCardFile: File | null;
  companyProfileFile: File | null;
  paymentReceiptFile: File | null;
};


export interface Location {
  id: string
  name: string
  region_id: string
  created_at: string
}

export interface License {
  id: string
  license_ref_id: string
  company_name: string
  business_type: string
  company_address: string
  region: string
  district_id: string
  country_of_origin: string
  full_name: string
  mobile_number: string
  email_address: string
  id_card_number: string
  passport_photos: string
  company_profile: string
  receipt_of_payment: string
  environmental_assessment_plan: string
  experience_profile: string
  risk_management_plan: string
  bank_statement: string
  license_type: string
  license_category: string
  calculated_fee: string
  license_area: string[]
  created_at: string
  updated_at: string
  expire_date: string
  location: Location
  signature: boolean
  signed_by_user_id?: string | null

  // Additional fields for the frontend
  qrCodeUrl?: string
  status?: string
  content?: string
}

// users
export interface TUsers {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
  emailVerified: boolean
}