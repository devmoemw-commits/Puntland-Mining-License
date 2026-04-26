"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface License {
  calculated_fee: string
  created_at: string
}

interface YearlyTrendsChartProps {
  licenses: License[]
}

export default function YearlyTrendsChart({ licenses }: YearlyTrendsChartProps) {
  // Get unique years from licenses
  const years = [...new Set(licenses.map((license) => new Date(license.created_at).getFullYear()))].sort()

  const yearlyData = years.map((year) => {
    const yearLicenses = licenses.filter((license) => new Date(license.created_at).getFullYear() === year)
    const revenue = yearLicenses.reduce((sum, license) => sum + Number.parseFloat(license.calculated_fee), 0)
    const count = yearLicenses.length

    return {
      year: year.toString(),
      revenue,
      count,
      avgFee: count > 0 ? revenue / count : 0,
    }
  })

  const chartConfig = {
    revenue: {
      label: "Revenue ($)",
      color: "#10b981",
    },
    count: {
      label: "License Count",
      color: "#3b82f6",
    },
    avgFee: {
      label: "Average Fee ($)",
      color: "#8b5cf6",
    },
  }

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  name === "revenue" || name === "avgFee" ? `$${Number(value).toLocaleString()}` : value,
                  name === "revenue" ? "Revenue" : name === "count" ? "License Count" : "Average Fee",
                ]}
              />
            }
          />
          <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="avgFee" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
