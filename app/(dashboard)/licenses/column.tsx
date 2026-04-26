"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { ValidityStatusBadge } from "./_components/validity-status-badge"
import { LicenseStatusBadge } from "./_components/license-status-badge"
import { LicenseActionsCell } from "./_components/license-actions-cell"

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
  license_area: string
  created_at: string
  updated_at: string
  expire_date: string
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED" // Make status required and add it as an accessor
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
    header: "License ID",
    cell: ({ row }) => <div>{row.getValue("license_ref_id")}</div>,
  },
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => <div>{row.getValue("company_name")}</div>,
  },
  {
    accessorKey: "license_area",
    header: "License Area",
    cell: ({ row }) => <div>{row.getValue("license_area")}</div>,
  },
  {
    accessorKey: "license_category",
    header: "Category",
    cell: ({ row }) => <div>{row.getValue("license_category")}</div>,
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Approval Status",

    cell: ({ row }) => {
      const status = row.getValue("status") as "PENDING" | "REVIEW" | "APPROVED" | "REJECTED"
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
