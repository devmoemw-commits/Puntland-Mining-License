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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  SlidersHorizontal,
} from "lucide-react"
import { DataTableFacetedFilter } from "./faceted-filter"
import { DataTableDateFilter } from "./date-range-filter"
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
  const [globalFilter, setGlobalFilter] = useState("")

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
    onGlobalFilterChange: setGlobalFilter,
    // Search matches company name OR license number
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).trim().toLowerCase()
      if (!search) return true
      const original = row.original as Record<string, unknown>
      return ["company_name", "license_ref_id"].some((key) =>
        String(original[key] ?? "").toLowerCase().includes(search),
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
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

  // District options derived from the loaded rows (location name, falling back to region).
  const districtOptions = Array.from(
    new Set(
      (data as Array<Record<string, unknown>>)
        .map((r) => {
          const loc = r.location as { name?: string } | undefined
          return loc?.name ?? (r.region as string | undefined) ?? ""
        })
        .filter((v): v is string => Boolean(v)),
    ),
  )
    .sort((a, b) => a.localeCompare(b))
    .map((d) => ({ label: d, value: d }))

  // Pagination counters for the footer.
  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div>
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center justify-between gap-6 w-full">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Search by company or license no..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
            {table.getColumn("status") && (
              <DataTableFacetedFilter
                column={table.getColumn("status")}
                title="Status"
                options={[
                  { label: "Draft", value: "DRAFT" },
                  { label: "Pending", value: "PENDING" },
                  { label: "In Review", value: "REVIEW" },
                  { label: "Approved", value: "APPROVED" },
                  { label: "Rejected", value: "REJECTED" },
                  { label: "Suspended", value: "SUSPENDED" },
                  { label: "Cancelled", value: "CANCELLED" },
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
            {table.getColumn("created") && (
              <DataTableDateFilter column={table.getColumn("created")} title="Date" />
            )}
            {table.getColumn("pricing") && (
              <DataTableFacetedFilter
                column={table.getColumn("pricing")}
                title="Pricing"
                options={[
                  { label: "Paid", value: "Paid" },
                  { label: "Free", value: "Free" },
                ]}
              />
            )}
            {table.getColumn("license_area") && (
              <DataTableFacetedFilter column={table.getColumn("license_area")} title="Area" options={areaOptions} />
            )}
            {table.getColumn("district") && districtOptions.length > 0 && (
              <DataTableFacetedFilter column={table.getColumn("district")} title="District" options={districtOptions} />
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedCount > 0 ? `${selectedCount} of ${totalRows} row(s) selected — ` : ""}
          {totalRows === 0
            ? "No results"
            : `Showing ${firstRow}–${lastRow} of ${totalRows}`}
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              Rows per page
            </span>
            <select
              aria-label="Rows per page"
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="First page"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Next page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              aria-label="Last page"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
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
