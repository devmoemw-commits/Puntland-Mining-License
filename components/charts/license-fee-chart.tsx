"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface License {
  license_type: string
  calculated_fee: string
}

interface LicenseFeeChartProps {
  licenses: License[]
}

export default function LicenseFeeChart({ licenses }: LicenseFeeChartProps) {
  // Group licenses by type and calculate average fees
  const licenseTypeData = licenses.reduce(
    (acc, license) => {
      const type = license.license_type
      const fee = Number.parseFloat(license.calculated_fee)

      if (!acc[type]) {
        acc[type] = { totalFee: 0, count: 0 }
      }

      acc[type].totalFee += fee
      acc[type].count += 1

      return acc
    },
    {} as Record<string, { totalFee: number; count: number }>,
  )

  const chartData = Object.entries(licenseTypeData).map(([type, data]) => ({
    licenseType: type,
    fee: data.totalFee / data.count, // Average fee for this type
    count: data.count,
    totalFee: data.totalFee,
  }))

  // Define colors for each bar
  const colors = ["#3730a3", "#10b981"] // Green and Blue

  const chartConfig = {
    fee: {
      label: "Average License Fee ($)",
      color: "#10b981",
    },
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">License Fees by Type</h2>
        <p className="text-muted-foreground text-sm">Average calculated fees for different license types</p>
      </div>

      <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="licenseType"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontSize={12} />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `License Type: ${label}`}
                formatter={(value, name, props) => [
                  `$${Number(value).toLocaleString()}`,
                  `Avg Fee (${props.payload.count} license${props.payload.count > 1 ? "s" : ""})`,
                ]}
              />
            }
          />
          <Bar dataKey="fee" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          <strong>Key Insight:</strong>{" "}
          {chartData.length > 1
            ? `${chartData.reduce((max, curr) => (curr.fee > max.fee ? curr : max)).licenseType} licenses have the highest average fee at $${chartData.reduce((max, curr) => (curr.fee > max.fee ? curr : max)).fee.toLocaleString()}`
            : "Single license type in dataset"}
        </p>
      </div>
    </div>
  )
}
