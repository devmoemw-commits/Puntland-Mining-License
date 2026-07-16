"use client"

import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnDef } from "@tanstack/react-table"
import { SampleActionsCell } from "./_components/sample-actions-cell"
import { LicenseStatusBadge } from "../licenses/_components/license-status-badge"

export type TSample = {
  id: string
  ref_id: string
  name: string
  passport_no: string
  kilo_gram: string
  status?: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED"
  created_at: string
  updated_at?: string
}




export const columns: ColumnDef<TSample>[] = [
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
    accessorKey: "ref_id",
    header: "Ref ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "passport_no",
    header: "Passport No",
  },
  {
    accessorKey: "kilo_gram",
    header: "Kilo Gram",
  },
  {
    accessorKey: "status",
    header: "Approval Status",
    cell: ({ row }) => <LicenseStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
  },
  {
    accessorKey: "updated_at",
    header: "Updated At",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sample = row.original
      return <SampleActionsCell sample={sample} />
    },
  },
]
