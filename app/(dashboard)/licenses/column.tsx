"use client"

import type { Column, ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ValidityStatusBadge } from "./_components/validity-status-badge"
import { LicenseStatusBadge } from "./_components/license-status-badge"
import { LicenseActionsCell } from "./_components/license-actions-cell"
import type { LicenseStatus } from "@/types/license-schema"

// Clickable header that toggles column sorting (asc → desc → none).
function sortableHeader(label: string) {
  const Header = ({ column }: { column: Column<License, unknown> }) => (
    <Button
      variant="ghost"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
  Header.displayName = `SortableHeader(${label})`
  return Header
}

// Define the License type based on your API response
export type License = {
  id: string
  license_ref_id: string
  company_name: string
  business_type: string
  company_address: string
  region: string
  district_id: string
  country_of_origin: string
  full_name: string
  mobile_number: string
  email_address: string
  id_card_number: string
  passport_photos: string
  company_profile: string
  receipt_of_payment: string
  license_type: string
  license_category: string
  calculated_fee: string
  /** True when the licence was created as Free (no fee charged). */
  is_free?: boolean
  license_area: string
  created_at: string
  updated_at: string
  expire_date: string
  status: LicenseStatus // Make status required and add it as an accessor
  review_comment?: string | null
  location?: {
    id: string
    name: string
    region_id: string
    created_at: string
  }
}

export const columns: ColumnDef<License>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "license_ref_id",
    header: sortableHeader("License ID"),
    cell: ({ row }) => <div>{row.getValue("license_ref_id")}</div>,
  },
  {
    accessorKey: "company_name",
    header: sortableHeader("Company"),
    cell: ({ row }) => <div>{row.getValue("company_name")}</div>,
  },
  {
    accessorKey: "license_area",
    header: "License Area",
    cell: ({ row }) => <div>{row.getValue("license_area")}</div>,
  },
  {
    id: "district",
    header: sortableHeader("District"),
    accessorFn: (row) => row.location?.name ?? row.region ?? "",
    cell: ({ row }) => <div>{row.getValue("district") || "—"}</div>,
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return (filterValue as string[]).includes(value as string)
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "license_category",
    header: sortableHeader("Category"),
    cell: ({ row }) => <div>{row.getValue("license_category")}</div>,
  },
  {
    id: "pricing",
    header: "Pricing",
    // Derived so the column is both sortable and filterable on a plain string.
    accessorFn: (row) => (row.is_free ? "Free" : "Paid"),
    cell: ({ row }) => {
      const isFree = Boolean(row.original.is_free)
      return (
        <Badge
          className={
            isFree
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-300"
              : "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
          }
        >
          {isFree ? "Free" : "Paid"}
        </Badge>
      )
    },
    filterFn: (row, columnId, filterValue) =>
      (filterValue as string[]).includes(row.getValue(columnId) as string),
    enableColumnFilter: true,
  },
  {
    id: "created",
    header: sortableHeader("Created"),
    accessorFn: (row) => row.created_at,
    cell: ({ row }) => {
      const raw = row.getValue("created") as string
      const d = new Date(raw)
      return (
        <div className="whitespace-nowrap">
          {Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString()}
        </div>
      )
    },
    // Bounds are absolute ISO strings resolved by the filter control, so this
    // stays a plain comparison (no per-row "what is today" work).
    filterFn: (row, columnId, filterValue) => {
      const range = filterValue as { from?: string; to?: string } | undefined
      if (!range || (!range.from && !range.to)) return true
      const value = new Date(row.getValue(columnId) as string).getTime()
      if (Number.isNaN(value)) return false
      if (range.from && value < new Date(range.from).getTime()) return false
      if (range.to && value > new Date(range.to).getTime()) return false
      return true
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Approval Status",

    cell: ({ row }) => {
      const status = row.getValue("status") as LicenseStatus
      return <LicenseStatusBadge status={status} />
    },
    filterFn: "arrIncludesSome",
  },
  {
    id: "validity",
    header: "Expiry Status",
    accessorFn: (row) => {
      const now = new Date()
      const expires = new Date(row.expire_date)
      return expires >= now ? "active" : "expired"
    },
    cell: ({ row }) => {
      return <ValidityStatusBadge expireDate={row.original.expire_date} />
    },
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return filterValue.includes(value)
    },
    enableColumnFilter: true,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return <LicenseActionsCell license={row.original} />
    },
    enableSorting: false,
    enableHiding: false,
  },
]
