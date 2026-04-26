"use client"

import { Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, ComposedChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface License {
  calculated_fee: string
  created_at: string
  license_type: string
}

interface MonthlyRevenueChartProps {
  licenses: License[]
  selectedYear: number
}

export default function MonthlyRevenueChart({ licenses, selectedYear }: MonthlyRevenueChartProps) {
  // Generate monthly data for the selected year
  const monthlyData = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthLicenses = licenses.filter((license) => {
      const date = new Date(license.created_at)
      return date.getFullYear() === selectedYear && date.getMonth() + 1 === month
    })

    const revenue = monthLicenses.reduce((sum, license) => sum + Number.parseFloat(license.calculated_fee), 0)
    const count = monthLicenses.length
    const newLicenses = monthLicenses.filter((l) => l.license_type === "New License").length
    const renewals = monthLicenses.filter((l) => l.license_type === "Renewal").length

    return {
      month: new Date(0, index).toLocaleString("default", { month: "short" }),
      revenue,
      count,
      newLicenses,
      renewals,
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
  }

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => [
                  name === "revenue" ? `$${Number(value).toLocaleString()}` : value,
                  name === "revenue" ? "Revenue" : "License Count",
                ]}
              />
            }
          />
          <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
