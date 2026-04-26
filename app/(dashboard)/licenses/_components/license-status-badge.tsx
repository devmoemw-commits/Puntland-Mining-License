"use client"

import { Badge } from "@/components/ui/badge"
import { getStatusColorClass, getStatusDisplayText } from "@/types/license-schema"
import type { LicenseStatus } from "@/types/license-schema"

interface LicenseStatusBadgeProps {
  status: LicenseStatus | undefined
  className?: string
}

export function LicenseStatusBadge({ status = "PENDING", className }: LicenseStatusBadgeProps) {
  const displayText = getStatusDisplayText(status)
  const colorClass = getStatusColorClass(status)

  return <Badge className={`${colorClass} ${className || ""}`}>{displayText}</Badge>
}
