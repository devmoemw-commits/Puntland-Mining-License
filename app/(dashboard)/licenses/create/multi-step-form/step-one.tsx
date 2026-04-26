"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Building, Building2, MapIcon, MapPin, MapPinHouse } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { firstStepSchema } from "@/types/license-schema"
import type { z } from "zod"

type RegionDistrict = {
  regionId: string
  regionName: string
  districtId: string
  districtName: string
}

type StepOneProps = {
  onNext: (values: z.infer<typeof firstStepSchema>) => void
  formData: z.infer<typeof firstStepSchema>
}

const StepOne = ({ onNext, formData }: StepOneProps) => {
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<{ id: string; name: string; regionId: string }[]>([])
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

  const businessTypes = [
    "Mining",
    "Construction",
    "Manufacturing",
    "Consulting",
    "Other",
  ];

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
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <SelectTrigger className="pl-10 w-full capitalize">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
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
                  <div className="relative">
                    <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                        <SelectTrigger className="pl-10 w-full capitalize">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id} className="capitalize">
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
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
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 z-10" />
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedRegion || loading}>
                        <SelectTrigger className="pl-10 w-full capitalize">
                          <SelectValue placeholder={selectedRegion ? "Select district" : "Choose region first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {!selectedRegion ? (
                            <div className="px-2 py-4 text-sm text-gray-500 text-center">
                              Please select a region first
                            </div>
                          ) : filteredDistricts.length > 0 ? (
                            filteredDistricts.map((district) => (
                              <SelectItem key={district.id} value={district.id} className="capitalize">
                                {district.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-sm text-gray-500 text-center">No districts found</div>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
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
