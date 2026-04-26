"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  Search,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type LicenseData = {
  id: string;
  license_ref_id: string;
  company_name: string;
  business_type: string;
  license_type: string;
  license_category: string;
  license_area: string;
  status: string;
  created_at: string;
  expire_date: string;
  location: {
    id: string;
    name: string;
    region_id: string;
    created_at: string;
  };
};

export default function VerifyLicensePage() {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const refId = searchParams.get("ref_id");

  useEffect(() => {
    if (!refId) {
      setError("No license reference ID provided");
      setLoading(false);
      return;
    }

    const fetchLicenseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/verify-license?ref_id=${encodeURIComponent(refId)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(
              "License not found. Please check the reference ID and try again."
            );
          }
          throw new Error("Failed to verify license. Please try again.");
        }

        const data = await response.json();

        if (data.status === "REJECTED") {
          setError("This license has been rejected.");
          setLicenseData(null);
          return;
        }

        if (data.status !== "APPROVED") {
          setError("License not approved or does not exist.");
          setLicenseData(null);
          return;
        }

        setLicenseData(data);
        toast.success("License verified successfully!");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLicenseData();
  }, [refId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expireDate: string) => {
    return new Date(expireDate) < new Date();
  };

  const goBack = () => {
    router.push("/verification");
  };

  const searchAgain = () => {
    router.push("/verification");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="text-lg">Verifying license {refId}...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between flex-wrap-reverse">
          <Button
            variant="outline"
            onClick={goBack}
            className="md:flex items-center gap-2 hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              License Verification Result
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Reference ID: {refId}
            </p>
          </div>
          <Button onClick={searchAgain} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            New Search
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <FileText className="h-8 w-8" />
                  <span className="text-xl font-medium">{error}</span>
                </div>
                <Button onClick={searchAgain} variant="outline">
                  Try Another License
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* License Information */}
        {licenseData && (
          <div className="space-y-6">
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                      License Verified ✓
                    </CardTitle>
                    <CardDescription className="text-lg mt-1">
                      {licenseData.license_ref_id}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      isExpired(licenseData.expire_date)
                        ? "destructive"
                        : "default"
                    }
                    className="text-sm"
                  >
                    {isExpired(licenseData.expire_date) ? "Expired" : "Active"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* License Details */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Company Name
                    </label>
                    <p className="text-lg font-semibold">
                      {licenseData.company_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Business Type
                    </label>
                    <p className="text-lg">{licenseData.business_type}</p>
                  </div>
                </CardContent>
              </Card>

              {/* License Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-amber-100 p-2 rounded-full mr-3">
                      <FileText className="h-5 w-5 text-amber-600" />
                    </div>
                    License Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      License Type
                    </label>
                    <p className="text-lg">{licenseData.license_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Category
                    </label>
                    <p className="text-lg">{licenseData.license_category}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      License Area
                    </label>
                    <p className="text-lg">{licenseData.license_area}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Location
                    </label>
                    <p className="text-lg">{licenseData.location.name}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Date Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                    </div>
                    Important Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Issue Date
                    </label>
                    <p className="text-lg">
                      {formatDate(licenseData.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Expiry Date
                    </label>
                    <p
                      className={`text-lg ${isExpired(licenseData.expire_date) ? "text-red-600 dark:text-red-400 font-semibold" : ""}`}
                    >
                      {formatDate(licenseData.expire_date)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button onClick={searchAgain} variant="outline">
                Verify Another License
              </Button>
              {/* <Button onClick={() => window.print()}>Print License Details</Button> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
