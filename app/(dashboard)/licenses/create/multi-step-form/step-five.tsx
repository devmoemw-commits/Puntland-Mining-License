"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Check,
  ArrowLeft,
  Building,
  StoreIcon as BuildingStore,
  User,
  Phone,
  MapPin,
  CopyrightIcon as License,
  DollarSign,
  Map,
  Mail,
  BadgeIcon as IdCard,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import type { z } from "zod"
import type { licensesSchema } from "@/types/license-schema"

interface StepFiveProps {
  onBack: () => void
  handleSubmit: (values: z.infer<typeof licensesSchema>) => void
  formData: z.infer<typeof licensesSchema>
  isSubmitting: boolean
}

const StepFive = ({ onBack, handleSubmit, formData, isSubmitting }: StepFiveProps) => {
  const onSubmit = () => {
    handleSubmit(formData)
  }

  // Check if document details are provided
  const hasDocuments = formData.passport_photos || formData.company_profile || formData.receipt_of_payment

  // Check if license details are provided
  const hasLicenseDetails = formData.license_type || formData.license_category || formData.license_area

  return (
    <div>
      <h3 className="text-2xl font-bold">Review Your Application</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">
        Please review all information before submitting your application
      </p>

      <Card className="border border-gray-200 mb-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Company Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-500">Company Information</h4>
                <Badge variant="outline" className="text-xs">
                  Step 1
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Name</p>
                    <p className="font-medium">{formData.company_name || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BuildingStore className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Business Type</p>
                    <p className="font-medium">{formData.business_type || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Country of Origin</p>
                    <p className="font-medium">{formData.country_of_origin || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Region</p>
                    <p className="font-medium">{formData.region || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company Address</p>
                    <p className="font-medium">{formData.company_address || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-500">Personal Information</h4>
                <Badge variant="outline" className="text-xs">
                  Step 2
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Full Name</p>
                    <p className="font-medium">{formData.full_name || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mobile Number</p>
                    <p className="font-medium">{formData.mobile_number || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email Address</p>
                    <p className="font-medium">{formData.email_address || "Not provided"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IdCard className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">ID Card Number</p>
                    <p className="font-medium">{formData.id_card_number || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Document Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-500">Document Information</h4>
                <Badge variant="outline" className="text-xs">
                  Step 3
                </Badge>
              </div>

              {hasDocuments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.passport_photos && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Passport Photos</p>
                        <p className="font-medium">{formData.passport_photos}</p>
                      </div>
                    </div>
                  )}

                  {formData.company_profile && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Company Profile</p>
                        <p className="font-medium">{formData.company_profile}</p>
                      </div>
                    </div>
                  )}

                  {formData.receipt_of_payment && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Receipt of Payment</p>
                        <p className="font-medium">{formData.receipt_of_payment}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 italic">No documents uploaded</p>
                </div>
              )}
            </div>

            <Separator />

            {/* License Details */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-500">License Details</h4>
                <Badge variant="outline" className="text-xs">
                  Step 4
                </Badge>
              </div>

              {hasLicenseDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <License className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">License Type</p>
                      <p className="font-medium">{formData.license_type || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <License className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">License Category</p>
                      <p className="font-medium">{formData.license_category || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">License Area</p>
                      <p className="font-medium">{formData.license_area || "Not provided"}</p>
                    </div>
                  </div>

                  {formData.license_fee && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">License Fee</p>
                        <p className="font-medium">${formData.license_fee}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-500 italic">No license details provided</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border dark:bg-gray-800 dark:border-gray-700 border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <div className="text-blue-500 shrink-0 mt-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-700 dark:text-gray-200">Confirmation</h4>
            <p className="text-sm text-blue-700 mt-1 dark:text-gray-200">
              By submitting this application, you confirm that all information provided is accurate and complete
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" type="button" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onSubmit} className="gap-2" disabled={isSubmitting}>
          <Check className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  )
}

export default StepFive
