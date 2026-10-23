"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { z } from "zod"
import AreaMultiSelect, { areas } from "@/components/area-multi-select"
import { cn } from "@/lib/utils"
import {
  PAYMENT_CHOICES,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
  formatMoney,
  getBalance,
  getPaymentStatus,
  planPaymentChoice,
  type PaymentChoice,
} from "@/lib/payment-status"

// Define the schema directly in this file using your schema format
const licenseInfoSchema = z.object({
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_fee: z.string().min(1, "License fee is required"),
  license_area: z.array(z.string()).min(1, "License area is required"),
  // Payment outcome at application: Paid Full / Discount / Paid Partially / Free.
  is_free: z.boolean().optional(),
  payment_type: z.enum(["FULL", "DISCOUNT", "PARTIAL", "FREE"]).optional(),
  discount_amount: z.string().optional(),
  partial_amount: z.string().optional(),
})

type LicenseCategory = {
  id: string
  name: string
  new_license_fee: string
  renewal_fee: string
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
      is_free: formData.is_free ?? false,
      payment_type: formData.payment_type ?? (formData.is_free ? "FREE" : "FULL"),
      discount_amount: formData.discount_amount ?? "",
      partial_amount: formData.partial_amount ?? "",
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
  const payment_type = (watch("payment_type") ?? "FULL") as PaymentChoice
  const discount_amount = watch("discount_amount")
  const partial_amount = watch("partial_amount")
  const is_free = payment_type === "FREE"
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
      return type === "Renewal" ? category.renewal_fee : category.new_license_fee
    },
    [categories],
  )

  // Reset category when it is no longer available (e.g. deactivated) once categories load
  useEffect(() => {
    if (categoriesLoading || !license_category) return
    const stillAvailable = categories.some((c) => c.name === license_category)
    if (!stillAvailable) {
      setValue("license_category", "", { shouldValidate: true })
    }
  }, [categoriesLoading, categories, license_category, setValue])

  // The category decides the fee; Free licences are stored with a fee of 0.
  const categoryFee =
    license_type && license_category ? getFeeForSelection(license_type, license_category) : ""

  useEffect(() => {
    if (is_free) {
      if (license_fee !== "0") setValue("license_fee", "0", { shouldValidate: true })
      return
    }
    if (categoryFee && license_fee !== categoryFee) {
      setValue("license_fee", categoryFee, { shouldValidate: true })
    }
  }, [is_free, categoryFee, license_fee, setValue])

  // Preview of what will be recorded, using the same rules as the server.
  const plan = categoryFee
    ? planPaymentChoice({
        fee: categoryFee,
        paid: 0,
        choice: payment_type,
        discountAmount: discount_amount,
        partialAmount: partial_amount,
      })
    : null
  const preview =
    plan && plan.ok
      ? {
          discount: plan.discount,
          collected: plan.record,
          owed: plan.isFree ? 0 : getBalance(categoryFee, plan.record, plan.discount),
          status: getPaymentStatus({
            isFree: plan.isFree,
            fee: categoryFee,
            paid: plan.record,
            discount: plan.discount,
          }),
        }
      : null

  const selectChoice = (choice: PaymentChoice) => {
    setValue("payment_type", choice)
    setValue("is_free", choice === "FREE")
    setPaymentError(null)
  }

  const onSubmit = (values: z.infer<typeof licenseInfoSchema>) => {
    if (categoryFee) {
      const check = planPaymentChoice({
        fee: categoryFee,
        paid: 0,
        choice: payment_type,
        discountAmount: values.discount_amount,
        partialAmount: values.partial_amount,
      })
      if (!check.ok) {
        setPaymentError(check.error)
        return
      }
    }
    setPaymentError(null)
    onNext({
      ...values,
      payment_type,
      is_free: payment_type === "FREE",
      license_fee: payment_type === "FREE" ? "0" : categoryFee || values.license_fee,
      discount_amount: payment_type === "DISCOUNT" ? values.discount_amount : "",
      partial_amount: payment_type === "PARTIAL" ? values.partial_amount : "",
    })
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

          <div>
            <Label className="text-base font-medium mb-3 block">
              3. Payment <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {PAYMENT_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => selectChoice(choice.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    payment_type === choice.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className="text-sm font-semibold">{choice.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{choice.hint}</div>
                </button>
              ))}
            </div>

            {payment_type === "DISCOUNT" && (
              <div className="mt-4 max-w-xs space-y-1.5">
                <Label htmlFor="discount_amount">Discount amount (waived)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1000"
                  value={discount_amount ?? ""}
                  onChange={(e) => {
                    setValue("discount_amount", e.target.value)
                    setPaymentError(null)
                  }}
                />
                {categoryFee && (
                  <p className="text-xs text-muted-foreground">
                    Fee is ${formatMoney(categoryFee)}. The rest is collected now.
                  </p>
                )}
              </div>
            )}

            {payment_type === "PARTIAL" && (
              <div className="mt-4 max-w-xs space-y-1.5">
                <Label htmlFor="partial_amount">Amount paid now</Label>
                <Input
                  id="partial_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 3000"
                  value={partial_amount ?? ""}
                  onChange={(e) => {
                    setValue("partial_amount", e.target.value)
                    setPaymentError(null)
                  }}
                />
                {categoryFee && (
                  <p className="text-xs text-muted-foreground">
                    Fee is ${formatMoney(categoryFee)}. The remainder stays owed.
                  </p>
                )}
              </div>
            )}

            {paymentError && <p className="mt-2 text-sm font-medium text-destructive">{paymentError}</p>}
          </div>

          <div className="pt-4">
            <Label className="text-base font-medium">4. Fees Calculation</Label>
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
                  <div className="border-t pt-2 mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-200">Licence Fee:</span>
                      {is_free ? (
                        <span className="font-medium text-emerald-600">Free</span>
                      ) : (
                        <span className="font-medium">${categoryFee ? formatMoney(categoryFee) : "0"}</span>
                      )}
                    </div>
                    {preview && preview.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-200">Discount:</span>
                        <span className="font-medium text-violet-600">- ${formatMoney(preview.discount)}</span>
                      </div>
                    )}
                    {preview && !is_free && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-200">Collected now:</span>
                        <span className="font-medium">${formatMoney(preview.collected)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Still owed:</span>
                      <span className={preview && preview.owed > 0 ? "text-amber-600" : "text-blue-600"}>
                        ${formatMoney(preview?.owed ?? 0)}
                      </span>
                    </div>
                    {preview && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-200">Payment status:</span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            PAYMENT_STATUS_CLASSES[preview.status],
                          )}
                        >
                          {PAYMENT_STATUS_LABELS[preview.status]}
                        </span>
                      </div>
                    )}
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
