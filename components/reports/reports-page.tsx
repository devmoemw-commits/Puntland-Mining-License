"use client"

import { useEffect, useState } from "react"
import { Download, TrendingUp, TrendingDown, DollarSign, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import ExpirationReport from "./expiration-report"
import MonthlyRevenueChart from "./monthly-revenue-chart"
import YearlyTrendsChart from "./yearly-trends-chart"
import LicenseTypeBreakdown from "./license-type-breakdown"
import CountryDistributionReport from "./country-distribution-report"

interface License {
  id: string
  license_ref_id: string
  company_name: string
  business_type: string
  country_of_origin: string
  license_type: string
  license_category: string
  calculated_fee: string
  license_area: string
  created_at: string
  expire_date: string
}

interface ReportMetrics {
  totalRevenue: number
  totalLicenses: number
  avgLicenseFee: number
  newLicensesThisMonth: number
  renewalsThisMonth: number
  expiringNextMonth: number
  revenueGrowth: number
  licenseGrowth: number
}

export default function ReportsPage() {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString())
  const [reportType, setReportType] = useState("overview")
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalRevenue: 0,
    totalLicenses: 0,
    avgLicenseFee: 0,
    newLicensesThisMonth: 0,
    renewalsThisMonth: 0,
    expiringNextMonth: 0,
    revenueGrowth: 0,
    licenseGrowth: 0,
  })

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/licenses")
        if (!response.ok) throw new Error("Failed to fetch licenses")
        const data = await response.json()
        setLicenses(data)
        calculateMetrics(data)
      } catch (error) {
        console.error("Error fetching licenses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLicenses()
  }, [])

  const calculateMetrics = (licensesData: License[]) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Calculate basic metrics
    const totalRevenue = licensesData.reduce((sum, license) => sum + Number.parseFloat(license.calculated_fee), 0)
    const totalLicenses = licensesData.length
    const avgLicenseFee = totalRevenue / totalLicenses

    // Current month licenses
    const currentMonthLicenses = licensesData.filter((license) => {
      const createdDate = new Date(license.created_at)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    })

    const newLicensesThisMonth = currentMonthLicenses.filter((l) => l.license_type === "New License").length
    const renewalsThisMonth = currentMonthLicenses.filter((l) => l.license_type === "Renewal").length

    // Expiring next month
    const nextMonth = new Date(currentYear, currentMonth + 1, 1)
    const monthAfter = new Date(currentYear, currentMonth + 2, 1)
    const expiringNextMonth = licensesData.filter((license) => {
      const expireDate = new Date(license.expire_date)
      return expireDate >= nextMonth && expireDate < monthAfter
    }).length

    // Growth calculations (comparing to previous month)
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const prevMonthLicenses = licensesData.filter((license) => {
      const createdDate = new Date(license.created_at)
      return createdDate.getMonth() === prevMonth && createdDate.getFullYear() === prevYear
    })

    const prevMonthRevenue = prevMonthLicenses.reduce(
      (sum, license) => sum + Number.parseFloat(license.calculated_fee),
      0,
    )
    const currentMonthRevenue = currentMonthLicenses.reduce(
      (sum, license) => sum + Number.parseFloat(license.calculated_fee),
      0,
    )

    const revenueGrowth = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0
    const licenseGrowth =
      prevMonthLicenses.length > 0
        ? ((currentMonthLicenses.length - prevMonthLicenses.length) / prevMonthLicenses.length) * 100
        : 0

    setMetrics({
      totalRevenue,
      totalLicenses,
      avgLicenseFee,
      newLicensesThisMonth,
      renewalsThisMonth,
      expiringNextMonth,
      revenueGrowth,
      licenseGrowth,
    })
  }

  const exportReport = () => {
    // Implementation for exporting reports
    console.log("Exporting report...")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mining License Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights for mining operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.revenueGrowth).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLicenses}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metrics.licenseGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(metrics.licenseGrowth).toFixed(1)}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg License Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.avgLicenseFee.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per license average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.expiringNextMonth}</div>
            <p className="text-xs text-muted-foreground">Next month</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="expiration">Expiration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>This Month Summary</CardTitle>
                <CardDescription>Current month license activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">New Licenses</span>
                  <Badge variant="secondary">{metrics.newLicensesThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Renewals</span>
                  <Badge variant="outline">{metrics.renewalsThisMonth}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total This Month</span>
                  <Badge>{metrics.newLicensesThisMonth + metrics.renewalsThisMonth}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Revenue Growth</span>
                  <Badge variant={metrics.revenueGrowth >= 0 ? "default" : "destructive"}>
                    {metrics.revenueGrowth >= 0 ? "+" : ""}
                    {metrics.revenueGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">License Growth</span>
                  <Badge variant={metrics.licenseGrowth >= 0 ? "default" : "destructive"}>
                    {metrics.licenseGrowth >= 0 ? "+" : ""}
                    {metrics.licenseGrowth.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Processing Time</span>
                  <Badge variant="outline">2.3 days</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Monthly Revenue Trends</CardTitle>
                  <CardDescription>Revenue and license count by month</CardDescription>
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <MonthlyRevenueChart licenses={licenses} selectedYear={Number.parseInt(selectedYear)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Trends Analysis</CardTitle>
              <CardDescription>Year-over-year performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <YearlyTrendsChart licenses={licenses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LicenseTypeBreakdown licenses={licenses} />
            <CountryDistributionReport licenses={licenses} />
          </div>
        </TabsContent>

        <TabsContent value="expiration" className="space-y-4">
          <ExpirationReport licenses={licenses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
