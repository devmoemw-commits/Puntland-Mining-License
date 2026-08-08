import type React from "react"
import {
  MoreVertical,
  FileBadge,
  FileCheck2,
  ShieldAlert,
  File,
  Clock,
  PauseCircle,
  DollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { auth } from "@/auth"
import { db } from "@/database/drizzle"
import { licenses, sampleAnalysis } from "@/database/schema"
import { count } from "drizzle-orm"
import { Permissions } from "@/lib/permissions"
import { userHasPermission } from "@/lib/permissions-server"

interface MetricCardProps {
  value: string | number
  label: string
  icon: React.ReactNode
  iconClassName?: string
  className?: string
}

/**
 * Dashboard metrics must not use fetch() to our own API from a Server Component:
 * cookies are not sent to absolute URLs, so /api/* returns 401 JSON `{ error }`, not an array.
 * Read from the DB here (same as /api/licenses and /api/samples) with matching permission rules.
 */
type MetricLicenseRow = {
  status: string
  expire_date: Date
  calculated_fee: string | null
}

async function loadDashboardMetrics() {
  const session = await auth()
  if (!session?.user) {
    return {
      licenseRows: [] as MetricLicenseRow[],
      sampleCount: 0,
    }
  }

  const licenseRows = (await db
    .select({
      status: licenses.status,
      expire_date: licenses.expire_date,
      calculated_fee: licenses.calculated_fee,
    })
    .from(licenses)) as MetricLicenseRow[]

  let sampleCount = 0
  if (
    await userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.SAMPLE_ANALYSIS_ACCESS,
    )
  ) {
    const [row] = await db.select({ n: count() }).from(sampleAnalysis)
    sampleCount = Number(row?.n ?? 0)
  }

  return { licenseRows, sampleCount }
}

const MetricCard = ({ value, label, icon, iconClassName, className }: MetricCardProps) => {
  return (
    <div className={cn("relative rounded-xl border p-6", className)}>
      <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
        <MoreVertical size={16} />
      </button>
      <div className="flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconClassName)}>{icon}</div>
        <div>
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default async function MetricCards() {
  const { licenseRows, sampleCount } = await loadDashboardMetrics()

  const now = new Date()
  const isExpired = (row: MetricLicenseRow) => new Date(row.expire_date) < now

  const totalLicenses = licenseRows.length
  const pending = licenseRows.filter(
    (r) => r.status === "PENDING" || r.status === "REVIEW",
  ).length
  // Active = approved and not past expiry.
  const active = licenseRows.filter(
    (r) => r.status === "APPROVED" && !isExpired(r),
  ).length
  // Expired = approved but past the expiry date.
  const expired = licenseRows.filter(
    (r) => r.status === "APPROVED" && isExpired(r),
  ).length
  const suspended = licenseRows.filter((r) => r.status === "SUSPENDED").length

  // Revenue = sum of fees for approved licenses.
  const revenue = licenseRows
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + (Number(r.calculated_fee) || 0), 0)
  const revenueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(revenue)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <MetricCard
        value={totalLicenses}
        label="Applications"
        icon={<FileBadge className="h-6 w-6 text-indigo-600" />}
        iconClassName="bg-indigo-100"
      />
      <MetricCard
        value={pending}
        label="Pending Review"
        icon={<Clock className="h-6 w-6 text-yellow-600" />}
        iconClassName="bg-yellow-100"
      />
      <MetricCard
        value={active}
        label="Active Licenses"
        icon={<FileCheck2 className="h-6 w-6 text-green-600" />}
        iconClassName="bg-green-100"
      />
      <MetricCard
        value={expired}
        label="Expired Licenses"
        icon={<ShieldAlert className="h-6 w-6 text-orange-600" />}
        iconClassName="bg-orange-100"
      />
      <MetricCard
        value={suspended}
        label="Suspended"
        icon={<PauseCircle className="h-6 w-6 text-red-600" />}
        iconClassName="bg-red-100"
      />
      <MetricCard
        value={revenueFormatted}
        label="Revenue Collected"
        icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
        iconClassName="bg-emerald-100"
      />
      <MetricCard
        value={sampleCount}
        label="Total Samples"
        icon={<File className="h-6 w-6 text-pink-600" />}
        iconClassName="bg-pink-100"
      />
    </div>
  )
}
