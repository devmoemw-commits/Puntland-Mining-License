"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
})

interface LicenseUpdateFormProps {
  license: License
  onSuccess?: () => void
}

export function LicenseUpdateForm({ license, onSuccess }: LicenseUpdateFormProps) {
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

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

  // License types and categories
  const licenseTypes = ["New License", "Renewal"]
  const businessTypes = ["Mining", "Construction", "Manufacturing", "Consulting", "Other"]

  const licenseCategories = {
    "New License": [
      "Large Scale Mining Permit",
      "Small Scale Mining Permit",
      "Artisanal Gold Mining Permit",
      "Mining Equipment Rental Permit",
      "Stone Crusher Permit",
    ],
    Renewal: [
      "Large Scale Mining Permit",
      "Small Scale Mining Permit",
      "Artisanal Gold Mining Permit",
      "Mining Equipment Rental Permit",
      "Stone Crusher Permit",
    ],
  }

  // Helper function to get categories for a license type
  const getCategoriesForType = (type: string) => {
    return licenseCategories[type as keyof typeof licenseCategories] || []
  }

  // Reset category when license type changes, but preserve valid existing categories
  useEffect(() => {
    if (license_type) {
      const availableCategories = getCategoriesForType(license_type)
      const currentCategory = form.getValues("license_category")

      // Only reset if current category is not available for the selected license type
      // and if this is actually a user-initiated change (not initial load)
      if (currentCategory && !availableCategories.includes(currentCategory)) {
        // Only reset if the license type has actually changed from the original
        if (license_type !== license.license_type) {
          form.setValue("license_category", "", { shouldValidate: true })
        }
      }
    }
  }, [license_type, form, license.license_type])

  // Fee structure
  const fees = {
    "New License": {
      "Large Scale Mining": "5000",
      "Small Scale Mining": "2000",
      "Artisanal Gold Mining": "2500",
      "Mining Equipment Rental": "1500",
      "Stone Crusher": "700",
    },
    Renewal: {
      "Large Scale Mining": "2000",
      "Small Scale Mining": "500",
      "Artisanal Gold Mining": "1000",
      "Mining Equipment Rental": "500",
      "Stone Crusher": "400",
    },
  }

  // Calculate fee based on selections
  useEffect(() => {
    if (license_type && license_category) {
      // Map the full category names to the keys used in the fees object
      const categoryKey = license_category.includes("Large Scale")
        ? "Large Scale Mining"
        : license_category.includes("Small Scale")
          ? "Small Scale Mining"
          : license_category.includes("Artisanal")
            ? "Artisanal Gold Mining"
            : license_category.includes("Equipment")
              ? "Mining Equipment Rental"
              : license_category.includes("Stone")
                ? "Stone Crusher"
                : ""

      const fee = fees[license_type as keyof typeof fees]?.[categoryKey as keyof (typeof fees)["New License"]] || ""

      if (fee && form.getValues("calculated_fee") !== fee) {
        form.setValue("calculated_fee", fee, { shouldValidate: true })
      }
    }
  }, [license_type, license_category, form])

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const formattedValues = {
        ...values,
      }

      console.log("Submitting form with values:", formattedValues)

      const result = await UpdateLicense(formattedValues)
      console.log("Update result:", result)

      if (result?.validationErrors) {
        toast.error("Validation error")
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder={isLoading ? "Loading regions..." : "Select region"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isLoading || !selectedRegion || filteredDistricts.length === 0}
                        >
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoading
                                    ? "Loading districts..."
                                    : !selectedRegion
                                      ? "Select region first"
                                      : filteredDistricts.length === 0
                                        ? "No districts available"
                                        : "Select district"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredDistricts.map((district) => (
                              <SelectItem key={district.id} value={district.id}>
                                {district.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select license type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {licenseTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className="w-full">
                            <SelectTrigger>
                              <SelectValue placeholder="Select license category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {license_type &&
                              getCategoriesForType(license_type).map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
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
            <Button variant="outline" type="button" onClick={() => form.reset()}>
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
