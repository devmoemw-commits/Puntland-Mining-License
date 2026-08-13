"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

import { z } from "zod"
import AreaMultiSelect, { areas } from "@/components/area-multi-select"

// Define the schema directly in this file using your schema format
const licenseInfoSchema = z.object({
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_fee: z.string().min(1, "License fee is required"),
  license_area: z.array(z.string()).min(1, "License area is required"),
  
})

type LicenseCategory = {
  id: string
  name: string
  new_license_fee: string
  renewal_fee: string
  is_free: boolean
}

interface StepFourProps {
  onNext: (data: z.infer<typeof licenseInfoSchema>) => void
  onBack: () => void
  formData: z.infer<typeof licenseInfoSchema>
}

const StepFour = ({ onNext, onBack, formData }: StepFourProps) => {
  const form = useForm<z.infer<typeof licenseInfoSchema>>({
    resolver: zodResolver(licenseInfoSchema),
    defaultValues: {
      license_type: formData.license_type || "",
      license_category: formData.license_category || "",
      license_fee: formData.license_fee || "",
      license_area: formData.license_area || [],
    },
  })

  const {
    formState: {},
    setValue,
    watch,
  } = form

  const license_type = watch("license_type")
  const license_category = watch("license_category")
  const license_fee = watch("license_fee")
  const license_area = watch("license_area")

  // License types
  const licenseTypes = ["New License", "Renewal"]

  // Predefined categories are managed in Settings > License categories and loaded from the DB
  const [categories, setCategories] = useState<LicenseCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/license-categories")
        if (!res.ok) throw new Error("Failed to load categories")
        const data: LicenseCategory[] = await res.json()
        if (active) setCategories(data)
      } catch (error) {
        console.error("Failed to fetch license categories:", error)
      } finally {
        if (active) setCategoriesLoading(false)
      }
    }
    fetchCategories()
    return () => {
      active = false
    }
  }, [])

  const getFeeForSelection = useCallback(
    (type: string, categoryName: string): string => {
      const category = categories.find((c) => c.name === categoryName)
      if (!category) return ""
      // Free categories carry no fee.
      if (category.is_free) return "0"
      return type === "Renewal" ? category.renewal_fee : category.new_license_fee
    },
    [categories],
  )

  // Whether the currently selected category is Free.
  const selectedCategoryIsFree = categories.find(
    (c) => c.name === license_category,
  )?.is_free ?? false

  // Reset category when it is no longer available (e.g. deactivated) once categories load
  useEffect(() => {
    if (categoriesLoading || !license_category) return
    const stillAvailable = categories.some((c) => c.name === license_category)
    if (!stillAvailable) {
      setValue("license_category", "", { shouldValidate: true })
    }
  }, [categoriesLoading, categories, license_category, setValue])

  // Calculate fee based on selections
  useEffect(() => {
    if (license_type && license_category) {
      const fee = getFeeForSelection(license_type, license_category)

      // Only update if the fee has actually changed
      if (fee && license_fee !== fee) {
        setValue("license_fee", fee, { shouldValidate: true })
      }
    }
  }, [license_type, license_category, license_fee, setValue, getFeeForSelection])

  const onSubmit = (values: z.infer<typeof licenseInfoSchema>) => {
    onNext(values)
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">License Details</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">{`Please provide the details of the license you are applying for.`}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">
              1. License Information <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="license_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={licenseTypes.map((type) => ({
                          value: type,
                          label:
                            type === "New License"
                              ? "New License (Shatiga Cusub)"
                              : "Renewal (Cusboonaysiin)",
                        }))}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value)
                          // Reset category when type changes
                          setValue("license_category", "", { shouldValidate: false })
                        }}
                        placeholder="Select license type"
                        searchPlaceholder="Search license types..."
                        emptyText="No license type found."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Category</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={categories.map((category) => ({
                          value: category.name,
                          label: category.name,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!license_type || categoriesLoading}
                        placeholder={
                          categoriesLoading
                            ? "Loading categories..."
                            : license_type
                              ? "Select license category"
                              : "Select license type first"
                        }
                        searchPlaceholder="Search categories..."
                        emptyText="No category found."
                      />
                    </FormControl>
                    {field.value && (
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedCategoryIsFree
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        }`}
                      >
                        {selectedCategoryIsFree ? "Free — no payment required" : "Paid"}
                      </span>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-3 block">
              2. Mining Area <span className="text-red-500">*</span>
            </Label>
            <FormField
              control={form.control}
              name="license_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mining Area</FormLabel>
                  <FormControl>
                    <AreaMultiSelect options={areas} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4">
            <Label className="text-base font-medium">3. Fees Calculation</Label>
            <Card className="mt-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Fee Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-200">License Type:</span>
                    <span className="font-medium">{license_type || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-200">License Category:</span>
                    <span className="font-medium">{license_category || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-200">Mining Area:</span>
                    <span className="font-medium">
                      {license_area.length > 0 ? license_area.join(", ") : "Not selected"}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Fee:</span>
                      {selectedCategoryIsFree ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        <span className="text-blue-600">
                          ${license_fee ? Number.parseInt(license_fee).toLocaleString() : "0"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
  )
}

export default StepFour
