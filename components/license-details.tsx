"use client";

import { useRef, useState, useTransition } from "react";
import { useReactToPrint } from "react-to-print";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Building2,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Globe,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Printer,
  Eye,
  FileImage,
  FileTextIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { License } from "@/types";
import type { CertificateAssets } from "@/lib/data/get-system-config";
import Image from "next/image";
import MiningLicense from "./mining-license-template";
import {
  UpdateLicenseSignature,
  UpdateLicenseStatus,
} from "@/lib/actions/licenses.action";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/formatDate";

export default function LicenseDetails({
  license,
  certificateAssets,
  signerSignatureUrl,
  workflow,
}: {
  license: License;
  certificateAssets?: CertificateAssets;
  /** ImageKit URL from the signing user’s profile (`users.signature_image_url`). */
  signerSignatureUrl?: string | null;
  workflow?: {
    workflowName: string;
    workflowCode: string;
    currentStepNumber: number;
    isCompleted: boolean;
    nextStep: {
      fromStatus: string;
      toStatus: string;
      allowedRoles: string[];
    } | null;
    approvalRoles: {
      code: string;
      label: string;
      userName: string | null;
      userSignatureUrl: string | null;
    }[];
    transitions: {
      id: string;
      stepNumber: number;
      fromStatus: string;
      toStatus: string;
      comment: string | null;
      createdAt: string;
      actedByName: string | null;
      actedByRole: string | null;
      actedBySignatureUrl: string | null;
    }[];
  } | null;
}) {
  const [signature, setSignature] = useState(license.signature);
  const [isPending, startTransition] = useTransition();
  const [isWorkflowPending, startWorkflowTransition] = useTransition();
  const [workflowComment, setWorkflowComment] = useState("");
  const componentRef = useRef(null);

  const { data: session } = useSession();

  const router = useRouter();

  const printPageStyle = `
      @page {
        size: A4 landscape;
        margin: 0;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Ensure the printed content uses the page area */
      body {
        width: 297mm;
        height: 210mm;
        overflow: hidden;
      }

      /* Avoid any app layout constraints in print */
      #__next, #root {
        width: 100% !important;
        height: 100% !important;
      }

      /* Print the certificate at its intended paper size */
      [data-slot="card"] {
        box-shadow: none !important;
        border: 0 !important;
        border-radius: 0 !important;
      }
    `;

  const handlePrint = useReactToPrint({
    documentTitle: `WTMB-${license.company_name}`,
    contentRef: componentRef,
    pageStyle: printPageStyle,
    print: async (printIframe) => {
      // Ensure Tailwind/global styles exist inside the print iframe.
      const printDocument = printIframe.contentDocument;
      const printWindow = printIframe.contentWindow;
      if (!printDocument || !printWindow) return;

      const head = printDocument.head;
      const parentHead = document.head;

      const nodesToCopy = parentHead.querySelectorAll(
        'link[rel="stylesheet"], style'
      );

      nodesToCopy.forEach((node) => {
        head.appendChild(node.cloneNode(true));
      });

      const inlinePrintStyle = printDocument.createElement("style");
      inlinePrintStyle.setAttribute("data-react-to-print", "pageStyle");
      inlinePrintStyle.appendChild(printDocument.createTextNode(printPageStyle));
      head.appendChild(inlinePrintStyle);

      const links = Array.from(
        head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      );
      await Promise.all(
        links.map(
          (link) =>
            new Promise<void>((resolve) => {
              if (link.sheet) return resolve();
              link.onload = () => resolve();
              link.onerror = () => resolve();
            })
        )
      );

      printWindow.focus();
      printWindow.print();
    },
  });

  // Calculate days remaining until expiration
  const expireDate = new Date(license.expire_date);
  const today = new Date();
  const daysRemaining = Math.ceil(
    (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Determine status based on days remaining
  const isActive = daysRemaining > 0;
  const approvalRoles =
    workflow?.approvalRoles?.length
      ? workflow.approvalRoles
      : [
          {
            code: "ACCOUNTANT",
            label: "ACCOUNTANT",
            userName: null,
            userSignatureUrl: null,
          },
          {
            code: "ADMINISTRATOR",
            label: "ADMINISTRATOR",
            userName: null,
            userSignatureUrl: null,
          },
          { code: "CEO", label: "CEO", userName: null, userSignatureUrl: null },
        ];

  // Add this function after the component declaration and before the return statement
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab
      window.open(url, "_blank");
    }
  };

  const handleSignatureToggle = async (newSignatureStatus: boolean) => {
    startTransition(async () => {
      try {
        const result = await UpdateLicenseSignature({
          id: license.id,
          signature: newSignatureStatus,
        });

        if (result?.data?.error) {
          toast.error("Failed to update signature");
          // Revert the checkbox state on error
          setSignature(!newSignatureStatus);
        } else if (result?.data?.success) {
          toast.success("Signature updated successfully");
          setSignature(newSignatureStatus);
          router.refresh();
        }
      } catch (error) {
        toast.error("Failed to update signature");
        console.error("Error updating signature:", error);
        // Revert the checkbox state on error
        setSignature(!newSignatureStatus);
      }
    });
  };

  const handleWorkflowAction = (
    nextStatus: "REVIEW" | "APPROVED" | "REJECTED",
    label: string,
  ) => {
    if (nextStatus === "REJECTED" && !workflowComment.trim()) {
      toast.error("Please add a comment before rejecting review.");
      return;
    }

    startWorkflowTransition(async () => {
      try {
        const result = await UpdateLicenseStatus({
          id: license.id,
          status: nextStatus,
          comment: workflowComment.trim() || undefined,
        });

        if (result?.data?.error) {
          toast.error(String(result.data.error));
          return;
        }
        toast.success(`License ${label} successfully`);
        setWorkflowComment("");
        router.refresh();
      } catch (error) {
        toast.error("Failed to update workflow action");
        console.error("Error taking workflow action:", error);
      }
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary to-indigo-700 p-6 text-white dark:from-gray-900 dark:to-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold dark:text:gray-200">
                  Mining License Certificate
                </h1>
                <p className="text-blue-100 mt-1 dark:text:gray-200">
                  Issued by the Ministry of Mining
                </p>
              </div>
              <Badge className="bg-white text-indigo-700 hover:bg-blue-50 mt-4 md:mt-0 text-sm px-3 py-1">
                {isActive ? "Active" : "Expired"}
              </Badge>
            </div>
          </div>

          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row justify-between">
              <div>
                <p className="text-sm text-gray-500">License Reference ID</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {license.license_ref_id}
                </p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <p className="text-sm text-gray-500">License Category</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  Artisanal Gold Mining Permit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 capitalize">
          {/* Company Information */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Company Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Company Name</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.company_name}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.business_type}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">License Category</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.license_category}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Mining Area</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.license_area.join(", ")}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Country of Origin</p>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {license.country_of_origin}
                      </p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Company Address</p>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-500 mr-1 mt-1" />
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {license.company_address}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">License Type</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.license_type}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Status */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold">License Status</h2>
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full border-8 border-indigo-100 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-gray-200">
                    {daysRemaining}
                  </span>
                </div>
                <p className="text-gray-500">Days Remaining</p>

                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Issued</span>
                    <span className="text-sm text-gray-500">Expires</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full w-full">
                    <div
                      className={`h-2 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (daysRemaining / 365) * 100))}%`,
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(license.created_at, "PPPP")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(license.expire_date, "PPPP")}
                    </span>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger
                    className={`mt-6 w-full py-2 rounded-md ${license.status !== "APPROVED" ? "bg-gray-400 cursor-not-allowed text-gray-300" : "text-white bg-gradient-to-r from-primary to-indigo-700 cursor-pointer"}`}
                    disabled={license.status !== "APPROVED"}
                  >
                    {license.status === "APPROVED"
                      ? "View Full Certificate"
                      : "Not Available"}
                  </DialogTrigger>

                  <DialogContent className="fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 flex h-[100vh] w-[100vw] max-h-none max-w-none sm:max-w-none flex-col overflow-hidden bg-white p-0 dark:bg-gray-800 gap-0 rounded-none border-0">
                    <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-4">
                      <div ref={componentRef} className="mx-auto w-fit">
                        <MiningLicense
                          license_category={license.license_category}
                          licenseNumber={license.license_ref_id}
                          companyName={license.company_name}
                          licenseType={license.business_type}
                          miningArea={license.license_area}
                          signature={signature}
                          issueDate={license.created_at}
                          expiryDate={license.expire_date}
                          qrCodeUrl="/assets/sample-qr.png"
                          signerSignatureUrl={signerSignatureUrl}
                          ministerStampUrl={certificateAssets?.ministerStampUrl}
                        />
                      </div>
                    </div>
                    <DialogFooter className="border-t bg-white px-4 py-3 sm:px-6 dark:bg-gray-800 sm:justify-between">
                      {(session?.user?.role === "MINISTER" ||
                        session?.user?.role === "GENERAL_DIRECTOR") && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Signature</p>
                          <div className="flex items-center gap-1">
                            {isPending && (
                              <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                            )}
                            <input
                              type="checkbox"
                              className="ml-1 cursor-pointer"
                              checked={signature}
                              disabled={isPending}
                              onChange={(e) => {
                                const newValue = e.target.checked;
                                setSignature(newValue); // Optimistic update
                                handleSignatureToggle(newValue);
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <Button
                        variant="default"
                        onClick={handlePrint}
                        className="w-full cursor-pointer sm:w-auto"
                      >
                        <Printer />
                        Print Certificate
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* License Holder */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold">License Holder</h2>
              </div>

              <div className="flex items-center mb-6">
                <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mr-4">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">
                    {license.full_name}
                  </p>
                  <p className="text-sm text-gray-500">Primary Contact</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-3" />
                  <Link href={`tel:${license.mobile_number}`}>
                    {license.mobile_number}
                  </Link>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-3" />
                  <p className="text-gray-700 break-all dark:text-gray-200">
                    <Link href={`mailto:${license.email_address}`}>
                      {license.email_address}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-500 mr-3" />
                  <p className="text-gray-700 dark:text-gray-200">
                    ID: {license.id_card_number}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Details */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-amber-100 p-2 rounded-full mr-3">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold">License Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">License Area</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {license.license_area}
                    </p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">License Fee</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      ${license.calculated_fee} USD
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {formatDate(license.created_at)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expiration Date</p>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {formatDate(license.expire_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <p className="text-gray-500">
                    This license has been verified and is officially registered
                    with the Ministry of Mining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files Section */}
          <Card className="md:col-span-3">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <FileTextIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Uploaded Documents</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Passport Photos */}
                {license.passport_photos && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileImage className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Passport Photos
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="relative w-full h-24 bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={license.passport_photos || "/placeholder.svg"}
                          alt="Passport Photo"
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const fallback =
                              target.parentElement?.querySelector(
                                ".fallback-icon"
                              ) as HTMLElement;
                            if (fallback) {
                              target.style.display = "none";
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                        <div
                          className="fallback-icon absolute inset-0 bg-gray-100 rounded-md flex items-center justify-center"
                          style={{ display: "none" }}
                        >
                          <FileImage className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Passport Photos
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.passport_photos, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.passport_photos,
                            "passport-photo.jpg"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Company Profile */}
                {license.company_profile && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-red-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Company Profile
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-red-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Company Profile
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.company_profile, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.company_profile,
                            "company-profile.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Receipt of Payment */}
                {license.receipt_of_payment && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Receipt of Payment
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-green-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Payment Receipt
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.receipt_of_payment, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.receipt_of_payment,
                            "receipt-of-payment.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Bank Statement */}
                {license.bank_statement && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Bank Statement
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-yellow-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-yellow-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Bank Statement
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.bank_statement, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.bank_statement,
                            "bank-statement.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Company Profile */}
                {license.company_profile && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Company Profile
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-indigo-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-indigo-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Company Profile
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.company_profile, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.company_profile,
                            "company-profile.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Experience Profile */}
                {license.experience_profile && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-pink-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Experience Profile
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-pink-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-pink-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Experience Profile
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.experience_profile, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.experience_profile,
                            "experience-profile.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {/* Risk Management Plan */}
                {license.risk_management_plan && (
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <FileTextIcon className="h-5 w-5 text-green-600 mr-2" />
                      <h3 className="font-medium text-gray-900">
                        Risk Management Plan
                      </h3>
                    </div>
                    <div className="mb-3">
                      <div className="bg-green-50 rounded-md p-4 flex items-center justify-center h-20">
                        <FileTextIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Risk Management Plan
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(license.risk_management_plan, "_blank")
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          downloadFile(
                            license.risk_management_plan,
                            "risk-management-plan.pdf"
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* File Upload Info */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center text-sm text-gray-500">
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  <p>Supported file formats: PDF, DOC, DOCX, PNG, JPG, JPEG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold">Approval Workflow</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {approvalRoles.map((role) => {
                  const transition = workflow?.transitions.find(
                    (item) => item.actedByRole?.toUpperCase() === role.code,
                  );
                  const actorName = transition?.actedByName ?? "No action taker";
                  const actionStatus = transition?.toStatus?.toUpperCase();
                  const shouldRenderSignature =
                    actionStatus === "REVIEW" || actionStatus === "APPROVED";
                  const actorSignature = shouldRenderSignature
                    ? (transition?.actedBySignatureUrl ?? null)
                    : null;
                  const isSigned = Boolean(transition);
                  const actionLabel =
                    actionStatus === "REVIEW"
                      ? "Reviewed"
                      : actionStatus === "APPROVED"
                        ? "Approved"
                        : actionStatus === "REJECTED"
                          ? "Rejected"
                          : isSigned
                            ? "Action Taken"
                            : "Pending";
                  const isCurrentRole =
                    (session?.user?.role ?? "").toUpperCase() === role.code;
                  const canCurrentRoleAct =
                    isCurrentRole &&
                    !workflow?.isCompleted &&
                    !!workflow?.nextStep &&
                    (workflow.nextStep.allowedRoles.length === 0 ||
                      workflow.nextStep.allowedRoles.includes(role.code));
                  const nextStatus = workflow?.nextStep?.toStatus?.toUpperCase();
                  const requiresReviewComment = nextStatus === "REVIEW";
                  const primaryActionLabel =
                    nextStatus === "REVIEW"
                      ? "Review"
                      : nextStatus === "APPROVED"
                        ? "Approve"
                        : nextStatus === "REJECTED"
                          ? "Reject"
                          : "Approve";

                  return (
                    <div
                      key={role.code}
                      className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/40 p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-900"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {role.label}
                          </p>
                        </div>
                        <Badge
                          className="rounded-full px-2.5 py-0.5 text-[11px]"
                          variant={
                            actionStatus === "REJECTED"
                              ? "destructive"
                              : isSigned
                                ? "default"
                                : "outline"
                          }
                        >
                          {actionLabel}
                        </Badge>
                      </div>
                      <div className="flex min-h-10 items-center justify-start rounded-lg border border-dashed border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-800/40">
                        {actorSignature ? (
                          <Image
                            src={actorSignature}
                            alt={`${role.label} action signature`}
                            width={110}
                            height={32}
                            className="h-8 w-auto object-contain opacity-90"
                          />
                        ) : (
                          <span className="text-slate-300">No signature yet</span>
                        )}
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                        {transition ? actorName : "No action taken"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {transition ? formatDate(transition.createdAt, "dd MMMM, yyyy") : "--"}
                      </p>

                      {canCurrentRoleAct ? (
                        <div className="mt-4 space-y-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
                          {requiresReviewComment ? (
                            <div className="w-full">
                              <Textarea
                                placeholder="Optional review comment..."
                                value={workflowComment}
                                onChange={(e) => setWorkflowComment(e.target.value)}
                                className="min-h-20 text-sm"
                                disabled={isWorkflowPending}
                              />
                            </div>
                          ) : null}
                          <div className="flex items-center justify-start gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isWorkflowPending}
                              onClick={() => handleWorkflowAction("REJECTED", "rejected")}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {requiresReviewComment ? "Reject Review" : "Reject"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={isWorkflowPending}
                              onClick={() =>
                                handleWorkflowAction(
                                  (nextStatus as "REVIEW" | "APPROVED" | "REJECTED") ??
                                    "APPROVED",
                                  primaryActionLabel.toLowerCase() as "approved" | "returned" | "rejected",
                                )
                              }
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {primaryActionLabel}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {approvalRoles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
                  No approval roles configured in this workflow yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>
            License ID: {license.license_ref_id} • Created at:{" "}
            {license.created_at} • Last Updated: {license.updated_at}
          </p>
        </div>
      </div>
    </div>
  );
}
