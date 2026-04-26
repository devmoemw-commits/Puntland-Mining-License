"use client"

import { useState } from "react"
import { Progress } from "@/components/ui/progress"
import { useAction } from "next-safe-action/hooks"
import { useRouter } from "next/navigation"
import type { z } from "zod"
import { toast } from "sonner"

import StepOne from "./step-one"
import StepTwo from "./step-two"
import StepThree from "./step-three"
import type { licensesSchema } from "@/types/license-schema"
import { RegisterLicense } from "@/lib/actions/licenses.action"
import StepFour from "./step-four"
import StepFive from "./step-five"

type LicenseFormData = z.infer<typeof licensesSchema>

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState<number>(1)

  const [formData, setFormData] = useState<LicenseFormData>({
    company_name: "",
    business_type: "",
    company_address: "",
    region: "",
    district: "",
    country_of_origin: "",

    full_name: "",
    mobile_number: "",
    email_address: "",
    id_card_number: "",

    passport_photos: "",
    company_profile: "",
    receipt_of_payment: "",
    environmental_assessment_plan: "",
    experience_profile: "",
    risk_management_plan: "",
    bank_statement: "",

    license_type: "",
    license_category: "",
    license_fee: "",
    license_area: [],
  })

  const handleNextStep = (data: Partial<LicenseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setCurrentStep(currentStep + 1)
  }

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const progressValue = (currentStep / 5) * 100

  const stepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Company Information"
      case 2:
        return "Personal Details"
      case 3:
        return "Document Upload"
      case 4:
        return "License Info"
      case 5:
        return "Review & Submit"
      default:
        return ""
    }
  }

  const stepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Step 1 of 5"
      case 2:
        return "Step 2 of 5"
      case 3:
        return "Step 3 of 5"
      case 4:
        return "Step 4 of 5"
      case 5:
        return "Step 5 of 5"
      default:
        return ""
    }
  }

  const router = useRouter()

  const { execute, status } = useAction(RegisterLicense, {
    onExecute() {
      // Show loading toast when execution starts
      toast.loading("Submitting your application...")
    },
    onSuccess(data) {
      // Dismiss any existing toasts (including the loading toast)
      toast.dismiss()

      if (!data.data) {
        // No data means something went wrong
        toast.error("Submission Failed", {
          description: "There was a problem creating your license. Please try again.",
          duration: 5000,
          action: {
            label: "Try Again",
            onClick: () => finalSubmit(formData),
          },
        })
      } else {
        // We have data.data which contains { success: string }
        toast.success("Submission Successful", {
          description: data.data.success || "Your license has been created successfully!",
          duration: 5000,
          action: {
            label: "Licenses",
            onClick: () => router.push("/licenses"),
          },
        })

        // Redirect after a short delay to allow the toast to be seen
        setTimeout(() => {
          router.push("/licenses")
        }, 2000)
      }
    },
    onError(error) {
      // Dismiss any existing toasts (including the loading toast)
      toast.dismiss()

      toast.error("Submission Error", {
        description: `An unexpected error occurred: ${error}`,
        duration: 5000,
        action: {
          label: "Try Again",
          onClick: () => finalSubmit(formData),
        },
      })
    },
  })

  const finalSubmit = (values: LicenseFormData) => {
    execute(values)
  }

  return (
    <div className="w-full mx-auto p-6 md:p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{stepTitle()}</h1>
          <span className="text-sm text-gray-500">{stepDescription()}</span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 md:p-8">
        {currentStep === 1 && <StepOne onNext={handleNextStep} formData={formData} />}
        {currentStep === 2 && <StepTwo onNext={handleNextStep} onBack={handlePreviousStep} formData={formData} />}
        {currentStep === 3 && <StepThree onNext={handleNextStep} onBack={handlePreviousStep} formData={formData} />}
        {currentStep === 4 && <StepFour onNext={handleNextStep} onBack={handlePreviousStep} formData={formData} />}
        {currentStep === 5 && (
          <StepFive
            onBack={handlePreviousStep}
            handleSubmit={finalSubmit}
            formData={formData}
            isSubmitting={status === "executing"}
          />
        )}
      </div>
    </div>
  )
}
