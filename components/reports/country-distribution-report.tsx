"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface License {
  country_of_origin: string
  calculated_fee: string
}

interface CountryDistributionReportProps {
  licenses: License[]
}

export default function CountryDistributionReport({ licenses }: CountryDistributionReportProps) {
  const countryData = licenses.reduce(
    (acc, license) => {
      const country = license.country_of_origin || "Unknown"
      if (!acc[country]) {
        acc[country] = { count: 0, revenue: 0 }
      }
      acc[country].count += 1
      acc[country].revenue += Number.parseFloat(license.calculated_fee)
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  const chartData = Object.entries(countryData)
    .map(([country, data]) => ({
      country,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count)

  const chartConfig = {
    count: {
      label: "License Count",
      color: "#3b82f6",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Distribution</CardTitle>
        <CardDescription>Licenses by country of origin</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="country" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => [
                      `${value} licenses`,
                      `Revenue: $${props.payload.revenue.toLocaleString()}`,
                    ]}
                  />
                }
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
