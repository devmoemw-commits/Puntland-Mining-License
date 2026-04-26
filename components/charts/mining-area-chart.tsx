import type React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface License {
  license_area: string[] | string; // Can be array or string
  company_name: string;
  calculated_fee: string;
}

interface MiningAreaChartProps {
  licenses: License[];
}

const MiningAreaChart: React.FC<MiningAreaChartProps> = ({ licenses }) => {
  // Group licenses by mining area
  const areaData = licenses.reduce(
    (acc, license) => {
      let areas: string[] = [];

      // Handle both array and string cases
      if (Array.isArray(license.license_area)) {
        areas = license.license_area
          .filter(
            (area) =>
              area &&
              typeof area === "string" &&
              area.trim() !== "" &&
              area.toLowerCase() !== "undefined" &&
              area.toLowerCase() !== "null"
          )
          .map((area) => area.trim());
      } else if (typeof license.license_area === "string") {
        const area = license.license_area;
        if (
          area &&
          area.trim() !== "" &&
          area.toLowerCase() !== "undefined" &&
          area.toLowerCase() !== "null"
        ) {
          areas = [area.trim()];
        }
      }

      // If no valid areas found, use "Unknown Area"
      if (areas.length === 0) {
        areas = ["Unknown Area"];
      }

      // Process each area
      areas.forEach((area) => {
        if (!acc[area]) {
          acc[area] = { count: 0, companies: [], totalRevenue: 0 };
        }

        acc[area].count += 1;
        acc[area].companies.push(license.company_name || "Unknown Company");
        acc[area].totalRevenue +=
          Number.parseFloat(license.calculated_fee) || 0;
      });

      return acc;
    },
    {} as Record<
      string,
      { count: number; companies: string[]; totalRevenue: number }
    >
  );

  // Prepare data for Recharts
  const chartData = Object.entries(areaData).map(([area, data]) => ({
    area,
    count: data.count,
    totalRevenue: data.totalRevenue,
  }));

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
            Mining Area Distribution
          </h3>
          <p className="text-sm text-gray-600">
            License distribution by mining area
          </p>
        </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="area" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="totalRevenue"
              stroke="#8884d8"
              fill="#8884d8"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
  );
};

export default MiningAreaChart;
