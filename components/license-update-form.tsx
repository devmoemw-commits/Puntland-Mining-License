"use client"

import { useCallback, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UpdateLicense } from "@/lib/actions/licenses.action"
import PassportFileUpload from "./fileupload/passport-file"
import CompanyProfile from "./fileupload/company-profile"
import ReceiptOfPayment from "./fileupload/receipt-of-payment"
import EnvironmentalAssessmentPlan from "./fileupload/environmental-assessment-plan"
import ExperienceProfile from "./fileupload/experience-profile"
import RiskManagementPlan from "./fileupload/risk-management-plan"
import BankStatement from "./fileupload/bank-statement"
import AreaMultiSelect, { areas } from "./area-multi-select"
import { cn } from "@/lib/utils"
import {
  PAYMENT_CHOICES,
  PAYMENT_STATUS_CLASSES,
  PAYMENT_STATUS_LABELS,
  formatMoney,
  getBalance,
  getPaymentStatus,
  planPaymentChoice,
  statusToChoice,
  type PaymentChoice,
} from "@/lib/payment-status"

type RegionDistrict = {
  regionId: string
  regionName: string
  districtId: string
  districtName: string
}

// Define the License type
export type License = {
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
  is_free?: boolean
  amount_paid?: string | null
  discount_amount?: string | null
  license_area: string[] | string // Support both for backward compatibility
  created_at: string
  updated_at: string
}

// Define the form schema with validation
const formSchema = z.object({
  id: z.string().min(1, "License reference ID is required"),

  // Company Information
  company_name: z.string().min(2, "Company name must be at least 2 characters"),
  business_type: z.string().min(1, "Business type is required"),
  company_address: z.string().min(5, "Address must be at least 5 characters"),
  region: z.string().min(1, "Region is required"),
  district_id: z.string().min(1, "District is required"),
  country_of_origin: z.string().min(1, "Country of origin is required"),

  // Personal Information
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  mobile_number: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number"),
  email_address: z.string().email("Invalid email address"),
  id_card_number: z.string().min(1, "ID card number is required"),

  // Document Information
  passport_photos: z.string().optional(),
  company_profile: z.string().optional(),
  receipt_of_payment: z.string().optional(),
  environmental_assessment_plan: z.string().optional(),
  experience_profile: z.string().optional(),
  risk_management_plan: z.string().optional(),
  bank_statement: z.string().optional(),

  // License Information
  license_type: z.string().min(1, "License type is required"),
  license_category: z.string().min(1, "License category is required"),
  license_area: z.array(z.string()).min(1, "License area is required"),
  calculated_fee: z.string().min(1, "Calculated fee is required"),
  is_free: z.boolean().optional(),
  payment_type: z.enum(["FULL", "DISCOUNT", "PARTIAL", "FREE"]).optional(),
  discount_amount: z.string().optional(),
  partial_amount: z.string().optional(),
})

interface LicenseUpdateFormProps {
  license: License
  onSuccess?: () => void
}

const LICENSE_TYPES = ["New License", "Renewal"]

// Predefined business types are managed in Settings > Business types and loaded from the DB.
type BusinessType = {
  id: string
  name: string
}

// Predefined license categories are managed in Settings > License categories and loaded from the DB.
type LicenseCategory = {
  id: string
  name: string
  new_license_fee: string
  renewal_fee: string
}

export function LicenseUpdateForm({ license, onSuccess }: LicenseUpdateFormProps) {
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [categories, setCategories] = useState<LicenseCategory[]>([])
  const [businessTypeOptions, setBusinessTypeOptions] = useState<BusinessType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Current payment state of the licence (before any edit)
  const currentPaymentStatus = getPaymentStatus({
    isFree: license.is_free,
    fee: license.calculated_fee,
    paid: license.amount_paid,
    discount: license.discount_amount,
  })
  // Payment fields are only sent when the person actually changes the payment section.
  const [paymentTouched, setPaymentTouched] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Initialize the form with the license data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: license.id,
      company_name: license.company_name,
      business_type: license.business_type,
      company_address: license.company_address,
      region: license.region,
      district_id: license.district_id,
      country_of_origin: license.country_of_origin,
      full_name: license.full_name,
      mobile_number: license.mobile_number,
      email_address: license.email_address,
      id_card_number: license.id_card_number,
      passport_photos: license.passport_photos,
      company_profile: license.company_profile,
      receipt_of_payment: license.receipt_of_payment,
      license_type: license.license_type,
      license_category: license.license_category,
      license_area: Array.isArray(license.license_area)
        ? license.license_area
        : license.license_area
          ? [license.license_area]
          : [],
      calculated_fee: license.calculated_fee,
      is_free: license.is_free ?? false,
      payment_type: statusToChoice(currentPaymentStatus) ?? undefined,
      discount_amount: Number(license.discount_amount ?? 0) > 0 ? String(license.discount_amount) : "",
      partial_amount: "",
    },
  })

  // Fetch regions and districts data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/districts")
        const data: RegionDistrict[] = await response.json()

        // Extract unique regions
        const uniqueRegions = Array.from(
          new Map(data.map((item) => [item.regionId, { id: item.regionId, name: item.regionName }])).values(),
        )

        // Extract all districts with their region IDs
        const allDistricts = data.map((item) => ({
          id: item.districtId,
          name: item.districtName,
          regionId: item.regionId,
        }))

        setRegions(uniqueRegions)
        setDistricts(allDistricts)

        // Set initial filtered districts based on current region
        if (license.region) {
          const initialFiltered = allDistricts.filter((district) => district.regionId === license.region)
          setFilteredDistricts(initialFiltered)
        }

        setIsLoading(false)
        setIsDataLoaded(true)
      } catch (error) {
        console.error("Failed to fetch regions and districts:", error)
        setIsLoading(false)
      }
    }

    fetchData()
  }, [license.region])

  // Fetch predefined license categories
  useEffect(() => {
    let active = true
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/license-categories")
        if (!response.ok) throw new Error("Failed to load categories")
        const data: LicenseCategory[] = await response.json()
        if (active) setCategories(data)
      } catch (error) {
        console.error("Failed to fetch license categories:", error)
      }
    }
    fetchCategories()
    return () => {
      active = false
    }
  }, [])

  // Fetch predefined business types
  useEffect(() => {
    let active = true
    const fetchBusinessTypes = async () => {
      try {
        const response = await fetch("/api/business-types")
        if (!response.ok) throw new Error("Failed to load business types")
        const data: BusinessType[] = await response.json()
        if (active) setBusinessTypeOptions(data)
      } catch (error) {
        console.error("Failed to fetch business types:", error)
      }
    }
    fetchBusinessTypes()
    return () => {
      active = false
    }
  }, [])

  // Watch for region changes to filter districts
  const selectedRegion = form.watch("region")

  useEffect(() => {
    // Only run this effect after data is loaded to prevent clearing initial values
    if (!isDataLoaded) return

    if (selectedRegion) {
      const filtered = districts.filter((district) => district.regionId === selectedRegion)
      setFilteredDistricts(filtered)

      // Only reset district selection if the current selection doesn't belong to the selected region
      // AND this is not the initial load (to preserve existing district values)
      const currentDistrict = form.getValues("district_id")
      if (currentDistrict) {
        const districtBelongsToRegion = filtered.some((d) => d.id === currentDistrict)

        // Only clear if district doesn't belong to region AND we're not on initial load
        if (!districtBelongsToRegion && selectedRegion !== license.region) {
          form.setValue("district_id", "", { shouldValidate: false })
          form.clearErrors("district_id")
        }
      }
    } else {
      setFilteredDistricts([])
      // Only clear district if region is actually changed by user, not on initial load
      if (selectedRegion !== license.region) {
        form.setValue("district_id", "", { shouldValidate: false })
        form.clearErrors("district_id")
      }
    }
  }, [selectedRegion, districts, form, isDataLoaded, license.region])

  const license_type = form.watch("license_type")
  const license_category = form.watch("license_category")

  // Calculate fee based on the selected type + category (fees are stored on the category)
  const payment_type = form.watch("payment_type") as PaymentChoice | undefined
  const discount_amount = form.watch("discount_amount")
  const partial_amount = form.watch("partial_amount")
  const is_free = paymentTouched ? payment_type === "FREE" : !!license.is_free

  const getFeeForSelection = useCallback(
    (type: string, categoryName: string): string => {
      const category = categories.find((c) => c.name === categoryName)
      if (!category) return ""
      return type === "Renewal" ? category.renewal_fee : category.new_license_fee
    },
    [categories],
  )

  useEffect(() => {
    if (is_free) {
      if (form.getValues("calculated_fee") !== "0") {
        form.setValue("calculated_fee", "0", { shouldValidate: true })
      }
      return
    }
    if (license_type && license_category) {
      const fee = getFeeForSelection(license_type, license_category)

      if (fee && form.getValues("calculated_fee") !== fee) {
        form.setValue("calculated_fee", fee, { shouldValidate: true })
      }
    }
  }, [is_free, license_type, license_category, form, getFeeForSelection])

  const categoryFee =
    license_type && license_category ? getFeeForSelection(license_type, license_category) : ""
  const alreadyPaid = Number(license.amount_paid ?? 0)

  // Preview of the result of the chosen payment option (same rules as the server)
  const paymentPlan =
    paymentTouched && payment_type && categoryFee
      ? planPaymentChoice({
          fee: categoryFee,
          paid: alreadyPaid,
          choice: payment_type,
          discountAmount: discount_amount,
          partialAmount: partial_amount,
        })
      : null
  const paymentPreview =
    paymentPlan && paymentPlan.ok
      ? {
          collected: alreadyPaid + paymentPlan.record,
          record: paymentPlan.record,
          discount: paymentPlan.discount,
          owed: paymentPlan.isFree ? 0 : getBalance(categoryFee, alreadyPaid + paymentPlan.record, paymentPlan.discount),
          status: getPaymentStatus({
            isFree: paymentPlan.isFree,
            fee: categoryFee,
            paid: alreadyPaid + paymentPlan.record,
            discount: paymentPlan.discount,
          }),
        }
      : null

  const selectPaymentChoice = (choice: PaymentChoice) => {
    setPaymentTouched(true)
    setPaymentError(null)
    form.setValue("payment_type", choice)
    form.setValue("is_free", choice === "FREE")
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (paymentTouched && paymentPlan && !paymentPlan.ok) {
      setPaymentError(paymentPlan.error)
      return
    }
    setIsSubmitting(true)

    try {
      const { payment_type: chosen, discount_amount: discount, partial_amount: partial, ...rest } = values
      const formattedValues = paymentTouched && chosen
        ? {
            ...rest,
            is_free: chosen === "FREE",
            payment_type: chosen,
            discount_amount: chosen === "DISCOUNT" ? discount : undefined,
            partial_amount: chosen === "PARTIAL" ? partial : undefined,
          }
        : { ...rest, is_free: !!license.is_free }

      console.log("Submitting form with values:", formattedValues)

      const result = await UpdateLicense(formattedValues)
      console.log("Update result:", result)

      const failure = result?.data && "error" in result.data ? result.data.error : null
      if (result?.validationErrors) {
        toast.error("Validation error")
      } else if (failure || result?.serverError) {
        toast.error(failure || "Failed to update license")
        if (failure) setPaymentError(failure)
      } else {
        toast.success("License updated successfully")
        if (onSuccess) {
          onSuccess()
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error)
      toast.error(`An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Update License</CardTitle>
            <CardDescription>Update the license information for {license.company_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="company" className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                <TabsTrigger value="company">Company</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="license">License</TabsTrigger>
              </TabsList>

              {/* Company Information Tab */}
              <TabsContent value="company" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={(() => {
                              const selected = field.value
                                ? field.value.split(",").map((s) => s.trim()).filter(Boolean)
                                : []
                              // Keep any current value selectable even if later deactivated
                              const extra = selected
                                .filter((s) => !businessTypeOptions.some((t) => t.name === s))
                                .map((s) => ({ value: s, label: s }))
                              return [
                                ...extra,
                                ...businessTypeOptions.map((type) => ({
                                  value: type.name,
                                  label: type.name,
                                })),
                              ]
                            })()}
                            value={
                              field.value
                                ? field.value.split(",").map((s) => s.trim()).filter(Boolean)
                                : []
                            }
                            onChange={(arr) => field.onChange(arr.join(", "))}
                            placeholder="Select business type(s)"
                            searchPlaceholder="Search business types..."
                            emptyText="No business type found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="company_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter company address" className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={regions.map((region) => ({
                              value: region.id,
                              label: region.name,
                            }))}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                            placeholder={isLoading ? "Loading regions..." : "Select region"}
                            searchPlaceholder="Search regions..."
                            emptyText="No region found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={filteredDistricts.map((district) => ({
                              value: district.id,
                              label: district.name,
                            }))}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading || !selectedRegion || filteredDistricts.length === 0}
                            placeholder={
                              isLoading
                                ? "Loading districts..."
                                : !selectedRegion
                                  ? "Select region first"
                                  : filteredDistricts.length === 0
                                    ? "No districts available"
                                    : "Select district"
                            }
                            searchPlaceholder="Search districts..."
                            emptyText="No district found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country_of_origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter country of origin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mobile number" {...field} />
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
                        <Input placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="id_card_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Card Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID card number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="passport_photos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport Photos</FormLabel>
                        <FormControl>
                          <PassportFileUpload onFilesChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company_profile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Profile</FormLabel>
                        <FormControl>
                          <CompanyProfile onFilesChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="receipt_of_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt of Payment</FormLabel>
                        <FormControl>
                          <ReceiptOfPayment onFilesChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="environmental_assessment_plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Environmental Assessment Plan</FormLabel>
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
                        <FormLabel className="text-base font-medium">Experience Profile</FormLabel>
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
                        <FormLabel className="text-base font-medium">Risk Management Plan</FormLabel>
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
                        <FormLabel className="text-base font-medium">Bank Statement</FormLabel>
                        <FormControl>
                          <BankStatement onFilesChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* License Information Tab */}
              <TabsContent value="license" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="license_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={LICENSE_TYPES.map((type) => ({ value: type, label: type }))}
                            value={field.value}
                            onChange={field.onChange}
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
                            options={[
                              // Keep the current value selectable even if it was later deactivated
                              ...(field.value &&
                              !categories.some((c) => c.name === field.value)
                                ? [{ value: field.value, label: field.value }]
                                : []),
                              ...categories.map((category) => ({
                                value: category.name,
                                label: category.name,
                              })),
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select license category"
                            searchPlaceholder="Search categories..."
                            emptyText="No category found."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="license_area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mining Area</FormLabel>
                      <FormControl>
                        <AreaMultiSelect value={field.value} onChange={field.onChange} options={areas} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium">Payment</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      Currently:
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-semibold",
                          PAYMENT_STATUS_CLASSES[currentPaymentStatus],
                        )}
                      >
                        {PAYMENT_STATUS_LABELS[currentPaymentStatus]}
                      </span>
                      {!license.is_free && (
                        <span>
                          collected ${formatMoney(alreadyPaid)} · owed $
                          {formatMoney(getBalance(license.calculated_fee, license.amount_paid, license.discount_amount))}
                        </span>
                      )}
                    </div>
                  </div>
                  {license.is_free && Number(categoryFee || 0) > 0 && (!paymentTouched || payment_type === "FREE") && (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      This licence is marked Free, but the {license_category} category charges $
                      {formatMoney(categoryFee)}. If it should be charged, choose Paid Full, Discount or Paid
                      Partially.
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {PAYMENT_CHOICES.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => selectPaymentChoice(choice.value)}
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

                  {paymentTouched && payment_type === "DISCOUNT" && (
                    <div className="max-w-xs space-y-1.5">
                      <FormLabel htmlFor="edit_discount_amount">Discount amount (waived)</FormLabel>
                      <Input
                        id="edit_discount_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount_amount ?? ""}
                        onChange={(e) => {
                          form.setValue("discount_amount", e.target.value)
                          setPaymentError(null)
                        }}
                      />
                    </div>
                  )}

                  {paymentTouched && payment_type === "PARTIAL" && (
                    <div className="max-w-xs space-y-1.5">
                      <FormLabel htmlFor="edit_partial_amount">Amount collected now</FormLabel>
                      <Input
                        id="edit_partial_amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={partial_amount ?? ""}
                        onChange={(e) => {
                          form.setValue("partial_amount", e.target.value)
                          setPaymentError(null)
                        }}
                      />
                      {alreadyPaid > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Added to the ${formatMoney(alreadyPaid)} already collected.
                        </p>
                      )}
                    </div>
                  )}

                  {paymentPreview && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span>
                        Result:{" "}
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            PAYMENT_STATUS_CLASSES[paymentPreview.status],
                          )}
                        >
                          {PAYMENT_STATUS_LABELS[paymentPreview.status]}
                        </span>
                      </span>
                      {paymentPreview.discount > 0 && <span>Waived ${formatMoney(paymentPreview.discount)}</span>}
                      {paymentPreview.record > 0 && <span>Records ${formatMoney(paymentPreview.record)} now</span>}
                      <span>Owed ${formatMoney(paymentPreview.owed)}</span>
                    </div>
                  )}

                  {paymentError && <p className="text-sm font-medium text-destructive">{paymentError}</p>}
                </div>

                <FormField
                  control={form.control}
                  name="calculated_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calculated Fee (USD)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Fee will be calculated automatically"
                          {...field}
                          value={is_free ? "Free" : field.value}
                          disabled
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => {
                form.reset()
                setPaymentTouched(false)
                setPaymentError(null)
              }}>
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update License"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
