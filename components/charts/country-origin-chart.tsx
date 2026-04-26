"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface License {
  country_of_origin: string
  company_name: string
}

interface CountryOriginChartProps {
  licenses: License[]
}

const COLORS = [
  "#3730a3", // Primary color
  "#6366f1", // Indigo-400
  "#8b5cf6", // Violet-400
  "#06b6d4", // Cyan-500
  "#10b981", // Emerald-500
]

export default function CountryOriginChart({ licenses }: CountryOriginChartProps) {
  // Group licenses by country of origin with better handling of undefined/null values
  const countryData = licenses.reduce(
    (acc, license) => {
      // Handle undefined, null, empty string, or whitespace-only values
      let country = license.country_of_origin
      if (
        !country ||
        country.trim() === "" ||
        country.toLowerCase() === "undefined" ||
        country.toLowerCase() === "null"
      ) {
        country = "Unknown"
      } else {
        country = country.trim()
      }

      if (!acc[country]) {
        acc[country] = { count: 0, companies: [] }
      }

      acc[country].count += 1
      acc[country].companies.push(license.company_name || "Unknown Company")

      return acc
    },
    {} as Record<string, { count: number; companies: string[] }>,
  )

  const chartData = Object.entries(countryData).map(([country, data], index) => ({
    country,
    value: data.count,
    companies: data.companies,
    fill: COLORS[index % COLORS.length],
    percentage: ((data.count / licenses.length) * 100).toFixed(1),
  }))

  const chartConfig = Object.fromEntries(
    chartData.map((item, index) => [
      item.country,
      {
        label: item.country,
        color: COLORS[index % COLORS.length],
      },
    ]),
  )

  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Company Distribution by Country of Origin</h3>
          <p className="text-sm text-gray-600">Geographic distribution of mining companies</p>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-64 w-full">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Country: ${label}`}
                formatter={(value, name, props) => [
                  `${value} company${Number(value) > 1 ? "ies" : "y"} (${props.payload.percentage}%)`,
                  `Companies: ${props.payload.companies.join(", ")}`,
                ]}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="country"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent />} className="mt-4" />
        </PieChart>
      </ChartContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong>Key Insight:</strong>{" "}
          {chartData.length > 1
            ? `Companies originate from ${chartData.length} different ${chartData.some((d) => d.country === "Unknown") ? "countries/regions" : "countries"}, with ${chartData.reduce((max, curr) => (curr.value > max.value ? curr : max)).country} having the most companies (${chartData.reduce((max, curr) => (curr.value > max.value ? curr : max)).value})`
            : `All companies ${chartData[0]?.country === "Unknown" ? "have unknown origin" : `originate from ${chartData[0]?.country}`}`}
        </p>
      </div>
    </div>
  )
}
