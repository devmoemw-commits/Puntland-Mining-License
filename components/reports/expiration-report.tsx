"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface License {
  expire_date: string
  company_name: string
  license_ref_id: string
}

interface ExpirationReportProps {
  licenses: License[]
}

export default function ExpirationReport({ licenses }: ExpirationReportProps) {
  const now = new Date()

  // Group licenses by expiration timeframe
  const expirationData = licenses.reduce(
    (acc, license) => {
      const expireDate = new Date(license.expire_date)
      const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24))

      let category: string
      if (daysUntilExpiry < 0) category = "Expired"
      else if (daysUntilExpiry <= 30) category = "Next 30 Days"
      else if (daysUntilExpiry <= 90) category = "Next 90 Days"
      else if (daysUntilExpiry <= 180) category = "Next 6 Months"
      else category = "Beyond 6 Months"

      if (!acc[category]) {
        acc[category] = { count: 0, licenses: [] }
      }
      acc[category].count += 1
      acc[category].licenses.push(license)
      return acc
    },
    {} as Record<string, { count: number; licenses: License[] }>,
  )

  const chartData = [
    { category: "Expired", count: expirationData["Expired"]?.count || 0, color: "#ef4444" },
    { category: "Next 30 Days", count: expirationData["Next 30 Days"]?.count || 0, color: "#f59e0b" },
    { category: "Next 90 Days", count: expirationData["Next 90 Days"]?.count || 0, color: "#8b5cf6" },
    { category: "Next 6 Months", count: expirationData["Next 6 Months"]?.count || 0, color: "#3b82f6" },
    { category: "Beyond 6 Months", count: expirationData["Beyond 6 Months"]?.count || 0, color: "#10b981" },
  ]

  const chartConfig = {
    count: {
      label: "License Count",
      color: "#3b82f6",
    },
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>License Expiration Timeline</CardTitle>
          <CardDescription>Licenses grouped by expiration timeframe</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => [`${value} licenses`, "Count"]} />} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Expiration Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Critical - Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expirationData["Expired"]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Urgent - 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expirationData["Next 30 Days"]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Renewal process should start</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Planning - 90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{expirationData["Next 90 Days"]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Start planning renewal</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
