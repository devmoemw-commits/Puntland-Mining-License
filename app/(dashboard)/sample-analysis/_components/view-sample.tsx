"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useReactToPrint } from "react-to-print";
import Image from "next/image";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { UpdateSampleSignature } from "@/lib/actions/sample.action";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CountrySelector from "@/components/country-selector";

// Form validation schema
const formSchema = z.object({
  ref_id: z.string().min(1, "Reference ID is required"),
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  nationality: z.string().min(1, "Nationality is required"),
  passport_no: z
    .string()
    .min(1, "Passport number is required")
    .max(255, "Passport number is too long"),
  mineral_type: z
    .string()
    .min(1, "Mineral type is required")
    .max(255, "Mineral type is too long"),
  unit: z.string().min(1, "Unit is required"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = Number.parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number"),
});

// Update the interface to match the schema
interface SampleData {
  id?: string;
  ref_id: string;
  name: string;
  nationality: string;
  passport_no: string;
  amount: string;
  unit: string;
  mineral_type: string;
  signature?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Define the component props
interface ReusableSampleFormProps {
  mode: "insert" | "update" | "view";
  initialData?: SampleData;
  onSubmit: (data: SampleData) => Promise<boolean>;
}

export default function ReusableSampleForm({
  mode,
  initialData,
  onSubmit,
}: ReusableSampleFormProps) {
  const componentRef = useRef(null);
  const { data: session } = useSession();
  const [signature, setSignature] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ref_id: "",
      name: "",
      nationality: "",
      passport_no: "",
      mineral_type: "",
      unit: "kilogram",
      amount: "",
    },
  });

  const handlePrint = useReactToPrint({
    documentTitle: `Sample Analysis - ${form.getValues("name")}`,
    contentRef: componentRef,
  });

  // Update form data and signature state when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        ref_id: initialData.ref_id,
        name: initialData.name,
        nationality: initialData.nationality,
        passport_no: initialData.passport_no,
        mineral_type: initialData.mineral_type,
        unit: initialData.unit,
        amount: initialData.amount,
      });
      setSignature(initialData.signature ?? false);
    }
  }, [initialData, form]);

  const onFormSubmit = async (values: z.infer<typeof formSchema>) => {
    if (mode === "view") return;

    try {
      const dataToSubmit: SampleData = {
        ...values,
        signature: signature,
        ...(initialData?.id && { id: initialData.id }),
      };

      const result = await onSubmit(dataToSubmit);

      if (result) {
        toast.success(
          mode === "insert"
            ? "Sample registered successfully."
            : "Sample updated successfully."
        );
      } else {
        toast.error("Something went wrong.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        mode === "insert"
          ? "Failed to register sample."
          : "Failed to update sample."
      );
    }
  };

  // Use the created_at date from initialData if available, otherwise use current date
  const documentDate = initialData?.created_at
    ? new Date(initialData.created_at)
    : new Date();
  const day = documentDate.getDate();
  const month = documentDate.toLocaleString("default", { month: "long" });
  const year = documentDate.getFullYear();
  const formattedDate = `${day}${getDaySuffix(day)} ${month}, ${year}`;

  function getDaySuffix(day: number) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  // Determine if fields should be readonly
  const isReadOnly = mode === "view";

  // Determine button text based on mode
  const buttonText =
    mode === "insert" ? "Save" : mode === "update" ? "Update" : "Print";

  const handleSignatureToggle = async (newSignatureStatus: boolean) => {
    startTransition(async () => {
      try {
        // Check if initialData and id exist before proceeding
        if (!initialData?.id) {
          toast.error("Cannot update signature: No record ID found");
          return;
        }

        const result = await UpdateSampleSignature({
          id: initialData.id,
          signature: newSignatureStatus,
        });

        if (result?.data?.error) {
          toast.error("Failed to update signature");
          setSignature(!newSignatureStatus);
        } else if (result?.data?.success) {
          toast.success("Signature updated successfully");
          setSignature(newSignatureStatus);
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }
      } catch (error) {
        toast.error("Failed to update signature");
        console.error("Error updating signature:", error);
        setSignature(!newSignatureStatus);
      }
    });
  };

  return (
    <div
      ref={componentRef}
      className="w-full max-w-[800px] mx-auto my-3 bg-white p-16 relative text-black"
    >
      {/* Signature Toggle - only for admin users and when record exists */}
      {session?.user?.role === "GENERAL_DIRECTOR" &&
        initialData?.id &&
        mode === "update" && (
          <div className="flex items-center justify-between absolute top-4 right-4 print:hidden">
            <div className="relative">
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={signature}
                  disabled={isPending}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setSignature(newValue);
                    handleSignatureToggle(newValue);
                  }}
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {signature ? "Signed" : "Sign"}
                </span>
              </label>
            </div>
          </div>
        )}

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
        <form
          onSubmit={form.handleSubmit(onFormSubmit)}
          className="relative z-10"
        >
          {/* Header */}
          <div>
            <div className="grid grid-cols-5 gap-4 text-[14px] text-center items-center">
              <div className="text-sm font-bold col-span-2">
                <p>
                  Dawlada Puntland ee Soomaaliya Wasaaradda Tamarta Macdanta &
                  Biyaha Xafiiska Agaasimaha Guud
                </p>
              </div>
              <div className="col-span-1 flex flex-col items-center">
                <div className="w-[130px] h-[100px] relative mb-1">
                  <Image
                    src="/assets/puntland_logo.svg"
                    alt="Puntland Coat of Arms"
                    width={130}
                    height={100}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="text-sm font-bold col-span-2">
                <p>ولاية بونت لاند الصومالية</p>
                <p>وزارة الطاقة والمعادن والمياه</p>
                <p>مكتب المدير العام</p>
              </div>
            </div>
            <div className="text-center font-bold text-sm">
              <p>Puntland States of Somalia</p>
              <p>Ministry of Energy Minerals & Water</p>
              <p className="border p-1 my-3 border-black">
                OFFICE OF THE DIRECTOR GENERAL
              </p>
            </div>
          </div>

          {/* Reference and Date */}
          <div className="mt-2">
            <div className="flex justify-between px-4 py-1">
              <div>
                REF:
                {isReadOnly ? (
                  <span>{form.getValues("ref_id")}</span>
                ) : (
                  <FormField
                    control={form.control}
                    name="ref_id"
                    render={({ field }) => (
                      <FormItem className="inline-block">
                        <FormControl>
                          <Input
                            {...field}
                            className="inline-block w-[150px] border-0 border-b border-black rounded-none px-1 bg-transparent shadow-none focus-visible:ring-0"
                            placeholder="Reference ID"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <div>{formattedDate}</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-12 text-center">
            <h2 className="font-bold text-xl">TO WHOM IT MAY CONCERN</h2>
          </div>

          <div className="mt-8">
            <p className="font-bold underline mb-4">
              Subject: Authorization of Sample Analysis
            </p>

            {/* Dynamic Form Inputs */}
            <div className="mb-6 text-justify leading-relaxed">
              <span>
                The Ministry of Energy, Minerals and Water (MOEMW) of Puntland
                hereby authorizes Mr./Ms.{" "}
                {isReadOnly ? (
                  <span className="font-medium uppercase">{form.getValues("name")},</span>
                ) : (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <span className="inline-block">
                        <Input
                          {...field}
                          className="mx-1 border-0 border-b border-black focus:outline-none w-[200px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Full Name"
                        />
                      </span>
                    )}
                  />
                )}{" "}
                a citizen of{" "}
                {isReadOnly ? (
                  <span className="font-medium uppercase">
                    {form.getValues("nationality")},
                  </span>
                ) : (
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <span className="inline-block">
                        <CountrySelector
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select Country"
                        />
                      </span>
                    )}
                  />
                )}{" "}
                holding Passport No.{" "}
                {isReadOnly ? (
                  <span className="font-medium uppercase">
                    {form.getValues("passport_no")}
                  </span>
                ) : (
                  <FormField
                    control={form.control}
                    name="passport_no"
                    render={({ field }) => (
                      <span className="inline-block">
                        <Input
                          {...field}
                          className="mx-1 border-0 border-b border-black focus:outline-none w-[150px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Passport Number"
                        />
                      </span>
                    )}
                  />
                )}{" "}
                to take{" "}
                {isReadOnly ? (
                  <span className="font-medium ">
                    {form.getValues("amount")}
                  </span>
                ) : (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <span className="inline-block">
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          step="0.001"
                          className="mx-1 border-0 border-b border-black focus:outline-none w-[80px] px-1 text-center bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Amount"
                        />
                      </span>
                    )}
                  />
                )}{" "}
                {isReadOnly ? (
                  <span className="font-medium uppercase">{form.getValues("unit")}</span>
                ) : (
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <span className="inline-block">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-[120px] mx-1 inline-flex border-0 border-b border-black rounded-none px-1 h-auto py-0 font-normal hover:bg-transparent focus:bg-transparent shadow-none focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="milligrams">Milligrams</SelectItem>
                            <SelectItem value="grams">Grams</SelectItem>
                            <SelectItem value="kilograms">Kilograms</SelectItem>
                            <SelectItem value="tons">Metric Tons</SelectItem>
                          </SelectContent>
                        </Select>
                      </span>
                    )}
                  />
                )}
                {" "}
                 of{" "}
                {isReadOnly ? (
                  <span className="font-medium uppercase">
                    {form.getValues("mineral_type")}
                  </span>
                ) : (
                  <FormField
                    control={form.control}
                    name="mineral_type"
                    render={({ field }) => (
                      <span className="inline-block">
                        <Input
                          {...field}
                          className="mx-1 border-0 border-b border-black focus:outline-none w-[150px] px-1 bg-transparent rounded-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Mineral Type"
                        />
                      </span>
                    )}
                  />
                )}{" "}
                <span className="font-medium uppercase">mineral samples</span> from Puntland State of Somalia for testing
                and analysis purposes. These minerals have no commercial value.
              </span>
            </div>

            {/* Form Errors Display - only show in edit modes */}
            {!isReadOnly && (
              <div className="space-y-1 mb-4">
                <FormField
                  control={form.control}
                  name="ref_id"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passport_no"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mineral_type"
                  render={() => (
                    <div>
                      <FormMessage />
                    </div>
                  )}
                />
              </div>
            )}

            <p className="mb-12">
              This authorization shall be valid for one month from the date of
              issue.
            </p>
          </div>

          <div className="text-center mb-12">
            <p>Thanks for your kind cooperation</p>
          </div>

          {/* Signature Section */}
          <div className="mt-14 text-center">
            <p className="font-bold">Eng. Ismail Mohamed Hassan</p>
            <p className="mt-1">
              Director General of the Ministry of Energy, Minerals & Water
            </p>
            {/* Show signature image only when signed */}
            {signature && (
              <div className="flex justify-center mt-4">
                <div className="relative w-[140px] h-[70px] print:w-[200px] print:h-[100px]">
                  <Image
                    src="/assets/director-signature.png"
                    alt="Signature"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-14 text-center text-sm pt-2">
            <p>
              <span className="font-bold">Tel:</span> +252 907 993813, +252
              661711119
              <span className="font-bold mx-2">Office Email:</span>
              <span className="text-blue-600 underline">
                dg.moemw@plstate.so
              </span>
              <span className="font-bold mx-2">Website:</span>
              <span className="text-blue-600 underline">www.moemw.pl.so</span>
            </p>
          </div>

          {/* Submit Button */}
          <div className="mt-8 text-center print:hidden">
            <Button
              type={mode === "view" ? "button" : "submit"}
              onClick={mode === "view" ? () => handlePrint() : undefined}
              className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors w-full cursor-pointer"
            >
              {buttonText}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
