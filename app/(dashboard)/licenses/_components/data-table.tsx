"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
  type ColumnFiltersState,
  getFilteredRowModel,
  type VisibilityState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, SlidersHorizontal } from "lucide-react"
import { DataTableFacetedFilter } from "./faceted-filter"
import type { Table as ReactTable } from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const areaOptions = [
    { label: "All Puntland Areas", value: "All Puntland Areas" },
    { label: "Nugaal", value: "Nugaal" },
    { label: "Bari", value: "Bari" },
    { label: "Mudug", value: "Mudug" },
    { label: "Sanaag", value: "Sanaag" },
    { label: "Sool", value: "Sool" },
    { label: "Cayn", value: "Cayn" },
    { label: "Karkaar", value: "Karkaar" },
    { label: "Raas Casayr", value: "Raas Casayr" },
    { label: "Haylaan", value: "Haylaan" },



  ]

  return (
    <div>
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center justify-between gap-6 w-full">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Filter by company name..."
              value={(table.getColumn("company_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("company_name")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
            {table.getColumn("status") && (
              <DataTableFacetedFilter
                column={table.getColumn("status")}
                title="Status"
                options={[
                  { label: "Pending", value: "PENDING" },
                  { label: "In Review", value: "REVIEW" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
              />
            )}
            <DataTableFacetedFilter
              column={table.getColumn("validity")}
              title="Expiry Status"
              options={[
                { label: "Active", value: "active" },
                { label: "Expired", value: "expired" },
              ]}
            />
            {table.getColumn("license_area") && (
              <DataTableFacetedFilter column={table.getColumn("license_area")} title="Area" options={areaOptions} />
            )}
          </div>

          <div className="flex items-center justify-end space-x-2">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <Button variant="outline" size="sm" className="ml-auto">
                Bulk Actions ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => exportToCSV(table)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "ml-auto flex items-center gap-2" })}>
                <SlidersHorizontal size={15} />
                View
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="rounded-md border capitalize">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function exportToCSV<T>(table: ReactTable<T>) {
  const escapeCSV = (value: unknown) => {
    if (value == null) return ""
    const stringValue = String(value).replace(/"/g, '""')
    return `"${stringValue}"`
  }

  const headers = table
    .getVisibleLeafColumns()
    .filter((column) => column.id !== "select" && column.id !== "actions")
    .map((column) => escapeCSV(column.columnDef.header))
    .join(",")

  const rows = table
    .getFilteredRowModel()
    .rows.map((row) => {
      return row
        .getVisibleCells()
        .filter((cell) => cell.column.id !== "select" && cell.column.id !== "actions")
        .map((cell) => {
          if (cell.column.id === "expire_date") {
            const date = new Date(cell.getValue() as string)
            return escapeCSV(date.toLocaleDateString())
          }
          return escapeCSV(cell.getValue())
        })
        .join(",")
    })
    .join("\n")

  const csv = `${headers}\n${rows}`
  const BOM = "\uFEFF" // Optional: Supports Unicode
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", "licenses.csv")
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
