"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Phone, Mail, IdCard } from "lucide-react"

import { secondStepSchema } from "@/types/license-schema"
import type { z } from "zod"

interface StepTwoProps {
  onNext: (data: z.infer<typeof secondStepSchema>) => void
  onBack: () => void
  formData: z.infer<typeof secondStepSchema>
}

const StepTwo = ({ onNext, onBack, formData }: StepTwoProps) => {
  const form = useForm<z.infer<typeof secondStepSchema>>({
    resolver: zodResolver(secondStepSchema),
    defaultValues: {
      full_name: formData.full_name || "",
      mobile_number: formData.mobile_number || "",
      email_address: formData.email_address || "",
      id_card_number: formData.id_card_number || "",
    },
  })

  const onSubmit = (values: z.infer<typeof secondStepSchema>) => {
    onNext(values)
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">Personal Information</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">Please provide your contact details</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input {...field} className="pl-10" placeholder="Enter your full name" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mobile_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input {...field} className="pl-10" placeholder="Enter your mobile number (E.g. +252)" type="tel" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input {...field} className="pl-10" placeholder="Enter email address" type="email" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="id_card_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID Card Number / Passport Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input {...field} className="pl-10" placeholder="Enter your ID card number / passport number" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4">
            <Button onClick={onBack} variant="outline" type="button">
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default StepTwo
