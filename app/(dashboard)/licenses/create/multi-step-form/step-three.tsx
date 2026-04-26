"use client";

import type React from "react";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import PassportFileUpload from "@/components/fileupload/passport-file";
import ReceiptOfPayment from "@/components/fileupload/receipt-of-payment";
import CompanyProfile from "@/components/fileupload/company-profile";
import { thirdStepSchema } from "@/types/license-schema";
import { z } from "zod";
import EnvironmentalAssessmentPlan from "@/components/fileupload/environmental-assessment-plan";
import ExperienceProfile from "@/components/fileupload/experience-profile";
import RiskManagementPlan from "@/components/fileupload/risk-management-plan";
import BankStatement from "@/components/fileupload/bank-statement";

interface StepThreeProps {
  onNext: (data: z.infer<typeof thirdStepSchema>) => void;
  onBack: () => void;
  formData: z.infer<typeof thirdStepSchema>;
}

const StepThree = ({ onNext, onBack, formData }: StepThreeProps) => {
  // Remove zodResolver to make fields optional
  const form = useForm({
    defaultValues: {
      passport_photos: formData.passport_photos || "",
      company_profile: formData.company_profile || "",
      receipt_of_payment: formData.receipt_of_payment || "",
      environmental_assessment_plan: formData.environmental_assessment_plan || "",
      experience_profile: formData.experience_profile || "",
      risk_management_plan: formData.risk_management_plan || "",
      bank_statement: formData.bank_statement || "",
    },
  });

  const onSubmit = (values: z.infer<typeof thirdStepSchema>) => {
    onNext(values);
  };

  return (
    <div>
      <h3 className="text-2xl font-bold">Documents</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">
        Upload necessary documents for verification
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="passport_photos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Passport
                    </FormLabel>
                    <FormControl>
                      <PassportFileUpload onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company_profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Company Profile
                    </FormLabel>
                    <FormControl>
                      <CompanyProfile onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receipt_of_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Receipt of Payment
                    </FormLabel>
                    <FormControl>
                      <ReceiptOfPayment onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="environmental_assessment_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Environmental Assessment Plan
                    </FormLabel>
                    <FormControl>
                      <EnvironmentalAssessmentPlan onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience_profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Experience Profile
                    </FormLabel>
                    <FormControl>
                      <ExperienceProfile onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="risk_management_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Risk Management Plan
                    </FormLabel>
                    <FormControl>
                      <RiskManagementPlan onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bank_statement" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Bank Statement
                    </FormLabel>
                    <FormControl>
                      <BankStatement onFilesChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
             
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={onBack} variant="outline" type="button">
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default StepThree;
