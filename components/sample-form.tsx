"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { RegisterSampleAnalysis } from "@/lib/actions/sample.action"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import CountrySelector from "./country-selector"

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255, "Name is too long"),
  nationality: z.string().min(1, "Please select your nationality"),
  passportNo: z.string().min(1, "Passport number is required").max(255, "Passport number is too long"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = Number.parseFloat(val)
      return !isNaN(num) && num > 0
    }, "Amount must be a positive number"),
  unit: z.enum(["milligram", "gram", "kilogram", "ton"], {
    required_error: "Please select a unit",
  }),
  mineralType: z.string().min(1, "Mineral type is required").max(255, "Mineral type is too long"),
})

type FormData = z.infer<typeof formSchema>

export default function SampleForm() {
  const router = useRouter()
  const [refNumber, setRefNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nationality: "",
      passportNo: "",
      amount: "",
      unit: "kilogram",
      mineralType: "",
    },
  })

  useEffect(() => {
    async function fetchRefId() {
      try {
        const res = await fetch("/api/ref-id")
        if (!res.ok) throw new Error("Failed to fetch ref ID")
        const data = await res.json()
        setRefNumber(data.refId)
      } catch (error) {
        console.error(error)
      }
    }
    fetchRefId()
  }, [])

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true)

    try {
      const result = await RegisterSampleAnalysis({
        ref_id: refNumber,
        name: values.name,
        passport_no: values.passportNo,
        amount: values.amount,
        unit: values.unit,
        mineral_type: values.mineralType,
        nationality: values.nationality,
      })

      if (result) {
        toast.success("Sample registered successfully.")
        router.push("/sample-analysis")
      } else {
        toast.error("Something went wrong.")
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to register sample.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = new Date()
  const day = today.getDate()
  const month = today.toLocaleString("default", { month: "long" })
  const year = today.getFullYear()
  const formattedDate = `${day}${getDaySuffix(day)} ${month}, ${year}`

  function getDaySuffix(day: number) {
    if (day > 3 && day < 21) return "th"
    switch (day % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }

  return (
    <div className="w-full max-w-[800px] mx-auto border my-3 bg-white p-8 relative text-black">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full border-8 border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <Image
              src="/assets/puntland_logo.svg"
              alt="Puntland Coat of Arms"
              width={400}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-2">
            <div className="text-left text-sm">
              <p>Dawlada Puntland ee Soomaaliya</p>
              <p>Wasaaradda Tamarta Macdanta & Biyaha</p>
              <p>Xafiiska Agaasimaha Guud</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-[100px] h-[80px] relative mb-1">
                <Image
                  src="/assets/puntland_logo.svg"
                  alt="Puntland Coat of Arms"
                  width={100}
                  height={80}
                  className="object-contain"
                />
              </div>
              <p className="text-center font-bold">Puntland States of Somalia</p>
              <p className="text-center">Ministry of Energy Minerals & Water</p>
              <p className="text-center text-sm">OFFICE OF THE DIRECTOR GENERAL</p>
            </div>

            <div className="text-right text-sm" dir="rtl">
              <p>ولاية بونت لاند الصومالية</p>
              <p>وزارة الطاقة والمعادن والمياه</p>
              <p>مكتب المدير العام</p>
            </div>
          </div>

          {/* Reference and Date */}
          <div className="border border-black mt-2">
            <div className="flex justify-between px-4 py-1">
              <div>REF: MOEMW/DG/{refNumber ?? "Loading..."}</div>
              <div>{formattedDate}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-12 text-center">
            <h2 className="font-bold text-xl">TO WHOM IT MAY CONCERN</h2>
          </div>

          <div className="mt-8">
            <p className="font-bold underline mb-4">Subject: Authorization of Sample Analysis</p>

            {/* Dynamic Form Inputs */}
            <p className="mb-6 text-justify leading-relaxed">
              The Ministry of Energy, Minerals and Water (MOEMW) of Puntland hereby authorizes Mr./Ms.{" "}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <Input
                        {...field}
                        className="mx-1 border-0 border-b border-black focus:outline-none w-[200px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Full Name"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              a citizen of{" "}
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <CountrySelector value={field.value} onChange={field.onChange} placeholder="Select Country" />
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              holding Passport No.{" "}
              <FormField
                control={form.control}
                name="passportNo"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <Input
                        {...field}
                        className="mx-1 border-0 border-b border-black focus:outline-none w-[150px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Passport Number"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              to take{" "}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.001"
                        className="mx-1 border-0 border-b border-black focus:outline-none w-[80px] px-1 text-center bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Amount"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-[120px] mx-1 inline-flex border-0 border-b border-black rounded-none px-1 h-auto py-0 font-normal hover:bg-transparent focus:bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milligram">Milligram</SelectItem>
                          <SelectItem value="gram">Gram</SelectItem>
                          <SelectItem value="kilogram">Kilogram</SelectItem>
                          <SelectItem value="ton">Metric Ton</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              of{" "}
              <FormField
                control={form.control}
                name="mineralType"
                render={({ field }) => (
                  <FormItem className="inline-block">
                    <FormControl>
                      <Input
                        {...field}
                        className="mx-1 border-0 border-b border-black focus:outline-none w-[150px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Mineral Type"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />{" "}
              samples of minerals from Puntland State of Somalia for testing and analysis purposes. These minerals have no commercial value.
            </p>

            {/* Form Errors Display */}
            <div className="space-y-1 mb-4">
              <FormField
                control={form.control}
                name="name"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passportNo"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mineralType"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="mb-12">This authorization shall be valid for one month from the date of issue.</p>
          </div>

          <div className="text-center mb-12">
            <p>Thanks for your kind cooperation</p>
          </div>

          {/* Signature */}
          <div className="mt-8 text-center">
            <p className="font-bold">Eng. Ismail Mohamed Hassan</p>
            <p className="mt-1">Director General of the Ministry of Energy, Minerals & Water</p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm border-t pt-2">
            <p>
              <span className="font-bold">Tel:</span> +252 907 993813, +252 661711119
              <span className="font-bold mx-2">Office Email:</span>
              <span className="text-blue-600 underline">dg.moemw@plstate.so</span>
              <span className="font-bold mx-2">Website:</span>
              <span className="text-blue-600 underline">www.moemw.pl.so</span>
            </p>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center print:hidden">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              {isSubmitting ? "Saving..." : "Save Sample Analysis"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
