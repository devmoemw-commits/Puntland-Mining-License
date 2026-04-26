import type React from "react"
import { MoreVertical, FileBadge, FileCheck2, ShieldAlert, File } from "lucide-react"
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
async function loadDashboardMetrics() {
  const session = await auth()
  if (!session?.user) {
    return {
      licenseRows: [] as { expire_date: Date }[],
      sampleCount: 0,
    }
  }

  const licenseRows = await db
    .select({ expire_date: licenses.expire_date })
    .from(licenses)

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

  const activeLicenses = licenseRows.filter((row) => {
    const expireDate = new Date(row.expire_date)
    return expireDate >= now
  })

  const expiredLicenses = licenseRows.filter((row) => {
    const expireDate = new Date(row.expire_date)
    return expireDate < now
  })

  const totalLicenses = licenseRows.length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        value={totalLicenses}
        label="Total Licenses"
        icon={<FileBadge className="h-6 w-6 text-indigo-600" />}
        iconClassName="bg-indigo-100"
      />
      <MetricCard
        value={activeLicenses.length}
        label="Active Licenses"
        icon={<FileCheck2 className="h-6 w-6 text-cyan-600" />}
        iconClassName="bg-cyan-100"
      />
      <MetricCard
        value={expiredLicenses.length}
        label="Expired Licenses"
        icon={<ShieldAlert className="h-6 w-6 text-orange-600" />}
        iconClassName="bg-orange-100"
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
