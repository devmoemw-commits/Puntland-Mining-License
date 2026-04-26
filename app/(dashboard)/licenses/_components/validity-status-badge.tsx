"use client"

import { Badge } from "@/components/ui/badge"

interface ValidityStatusBadgeProps {
  expireDate: string
  className?: string
}

export function ValidityStatusBadge({ expireDate, className }: ValidityStatusBadgeProps) {
  const isExpired = new Date(expireDate) < new Date()

  const colorClass = isExpired
    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"

  return <Badge className={`${colorClass} ${className || ""}`}>{isExpired ? "Expired" : "Active"}</Badge>
}
