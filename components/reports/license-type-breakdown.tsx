"use client"

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface License {
  license_type: string
  calculated_fee: string
}

interface LicenseTypeBreakdownProps {
  licenses: License[]
}

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"]

export default function LicenseTypeBreakdown({ licenses }: LicenseTypeBreakdownProps) {
  const typeData = licenses.reduce(
    (acc, license) => {
      const type = license.license_type || "Unknown"
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 }
      }
      acc[type].count += 1
      acc[type].revenue += Number.parseFloat(license.calculated_fee)
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  const chartData = Object.entries(typeData).map(([type, data], index) => ({
    type,
    count: data.count,
    revenue: data.revenue,
    fill: COLORS[index % COLORS.length],
    percentage: ((data.count / licenses.length) * 100).toFixed(1),
  }))

  const chartConfig = Object.fromEntries(
    chartData.map((item, index) => [
      item.type,
      {
        label: item.type,
        color: COLORS[index % COLORS.length],
      },
    ]),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>License Type Breakdown</CardTitle>
        <CardDescription>Distribution by license type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, props) => [
                    `${value} licenses (${props.payload.percentage}%)`,
                    `Revenue: $${props.payload.revenue.toLocaleString()}`,
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
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
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
