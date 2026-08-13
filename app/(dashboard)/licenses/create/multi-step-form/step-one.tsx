"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building, MapIcon, MapPin, MapPinHouse } from "lucide-react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { MultiSelect } from "@/components/ui/multi-select"

/** Business types are stored comma-separated in the single `business_type` field. */
const splitTypes = (v: string) =>
  v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []
const joinTypes = (arr: string[]) => arr.join(", ")

import { firstStepSchema } from "@/types/license-schema"
import type { z } from "zod"

type RegionDistrict = {
  regionId: string
  regionName: string
  districtId: string
  districtName: string
}

type BusinessType = {
  id: string
  name: string
}

type StepOneProps = {
  onNext: (values: z.infer<typeof firstStepSchema>) => void
  formData: z.infer<typeof firstStepSchema>
}

const StepOne = ({ onNext, formData }: StepOneProps) => {
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof firstStepSchema>>({
    resolver: zodResolver(firstStepSchema),
    defaultValues: {
      company_name: formData.company_name || "",
      business_type: formData.business_type || "",
      company_address: formData.company_address || "",
      region: formData.region || "",
      district: formData.district || "",
      country_of_origin: formData.country_of_origin || "",
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
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch regions and districts:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch predefined business types
  useEffect(() => {
    let active = true
    const fetchBusinessTypes = async () => {
      try {
        const response = await fetch("/api/business-types")
        if (!response.ok) throw new Error("Failed to load business types")
        const data: BusinessType[] = await response.json()
        if (active) setBusinessTypes(data)
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
    if (selectedRegion) {
      const filtered = districts.filter((district) => district.regionId === selectedRegion)
      setFilteredDistricts(filtered)

      // Reset district selection if the current selection doesn't belong to the selected region
      const currentDistrict = form.getValues("district")
      const districtBelongsToRegion = filtered.some((d) => d.id === currentDistrict)

      if (currentDistrict && !districtBelongsToRegion) {
        form.setValue("district", "", { shouldValidate: false })
        // Clear any existing validation errors for district field
        form.clearErrors("district")
      }
    } else {
      setFilteredDistricts([])
      // Clear district when no region is selected
      form.setValue("district", "", { shouldValidate: false })
      form.clearErrors("district")
    }
  }, [selectedRegion, districts, form])

  const onSubmit = (values: z.infer<typeof firstStepSchema>) => {
    // Additional validation to ensure district belongs to selected region
    const selectedDistrictValid = filteredDistricts.some((d) => d.id === values.district)

    if (values.region && values.district && !selectedDistrictValid) {
      form.setError("district", {
        type: "manual",
        message: "Please select a valid district for the chosen region",
      })
      return
    }

    onNext(values)
  }

  return (
    <div>
      <h3 className="text-2xl font-bold">Company Details</h3>
      <p className="text-gray-500 text-sm mt-2 mb-6">Please provide your company information</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input {...field} className="pl-10" placeholder="Enter company name" />
                    </div>
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
                      options={businessTypes.map((type) => ({ value: type.name, label: type.name }))}
                      value={splitTypes(field.value)}
                      onChange={(arr) => field.onChange(joinTypes(arr))}
                      disabled={loading}
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
                  <div className="relative">
                    <MapPinHouse className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input {...field} className="pl-10" placeholder="Enter Company Address" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Region (Gobolka) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={regions.map((region) => ({ value: region.id, label: region.name }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loading}
                      placeholder="Select region"
                      searchPlaceholder="Search regions..."
                      emptyText="No region found."
                      icon={<MapIcon className="h-4 w-4" />}
                      triggerClassName="capitalize"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    District (Degmada) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={filteredDistricts.map((district) => ({
                        value: district.id,
                        label: district.name,
                      }))}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!selectedRegion || loading}
                      placeholder={selectedRegion ? "Select district" : "Choose region first"}
                      searchPlaceholder="Search districts..."
                      emptyText="No districts found."
                      icon={<MapPin className="h-4 w-4" />}
                      triggerClassName="capitalize"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country_of_origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Country of Origin (Dalka Asal ahaan) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input {...field} className="pl-10" placeholder="Enter country of origin" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4">
            <Button className="w-full" type="submit">
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default StepOne
