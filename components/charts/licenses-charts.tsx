"use client";

import { useEffect, useState } from "react";
import LicenseFeeChart from "./license-fee-chart";
import CountryOriginChart from "./country-origin-chart";
import MiningAreaChart from "./mining-area-chart";
import config from "@/lib/config/config";

interface License {
  id: string;
  license_ref_id: string;
  company_name: string;
  business_type: string;
  company_address: string;
  region: string;
  district_id: string;
  country_of_origin: string;
  full_name: string;
  mobile_number: string;
  email_address: string;
  id_card_number: string;
  passport_photos: string;
  company_profile: string;
  receipt_of_payment: string;
  license_type: string;
  license_category: string;
  calculated_fee: string;
  license_area: string;
  created_at: string;
  updated_at: string;
  expire_date: string;
  location: {
    id: string;
    name: string;
    region_id: string;
    created_at: string;
  };
}

export default function LicensesCharts() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch(`${config.env.apiEndpoint}/api/licenses`);
        if (!response.ok) {
          throw new Error("Failed to fetch licenses");
        }
        const data = await response.json();
        setLicenses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

  if (loading) {
    return (
      <div className="bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading license data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-500">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-card rounded-lg border shadow-sm">
          <LicenseFeeChart licenses={licenses} />
        </div>
        <div className="bg-card rounded-lg border shadow-sm">
          <MiningAreaChart licenses={licenses} />
        </div>

        <div className="bg-card rounded-lg border shadow-sm">
          <CountryOriginChart licenses={licenses} />
        </div>
      </div>
    </div>
  );
}
