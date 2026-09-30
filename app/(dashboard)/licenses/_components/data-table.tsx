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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
} from "lucide-react"
import { DataTableFacetedFilter } from "./faceted-filter"
import { DataTableDateFilter } from "./date-range-filter"
import type { Table as ReactTable } from "@tanstack/react-table"
import type { SheetData } from "write-excel-file/browser"

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
            {table.getColumn("payment") && (
              <DataTableFacetedFilter
                column={table.getColumn("payment")}
                title="Payment"
                options={[
                  { label: "Free", value: "Free" },
                  { label: "Unpaid", value: "Unpaid" },
                  { label: "Partially Paid", value: "Partially Paid" },
                  { label: "Paid", value: "Paid" },
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
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "ml-auto flex items-center gap-2",
                })}
              >
                <Download className="h-4 w-4" />
                Export
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} row(s) — current filters
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void exportToXLSX(table)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void exportToPDF(table)}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  PDF (landscape)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exportToCSV(table)}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

/* ------------------------------ Export helpers ----------------------------- */

/** Readable header per column id (several headers are sortable components, not strings). */
const COLUMN_LABELS: Record<string, string> = {
  license_ref_id: "License ID",
  company_name: "Company",
  collector: "Collector",
  license_area: "License Area",
  district: "District",
  license_category: "Category",
  payment: "Payment",
  amount: "Amount (USD)",
  amount_paid: "Paid (USD)",
  balance: "Balance (USD)",
  created: "Created",
  status: "Approval Status",
  validity: "Expiry Status",
}

function headerLabel(columnId: string, header: unknown): string {
  if (COLUMN_LABELS[columnId]) return COLUMN_LABELS[columnId]
  if (typeof header === "string" && header.trim()) return header
  return columnId
    .replace(/_/g, " ")
    .replace(/w/g, (c) => c.toUpperCase())
}

/** Normalise a cell for export: dates readable, amounts numeric, everything else text. */
function exportValue(columnId: string, raw: unknown): string | number {
  if (raw == null) return ""
  if (columnId === "created" || columnId === "expire_date") {
    const d = new Date(String(raw))
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString()
  }
  if (columnId === "amount") {
    const n = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(n) ? n : 0
  }
  if (columnId === "status" || columnId === "validity") {
    const t = String(raw)
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
  }
  return String(raw)
}

/** Visible columns + currently filtered/sorted rows — what the user actually sees. */
function collectExportData<T>(table: ReactTable<T>) {
  const columns = table
    .getVisibleLeafColumns()
    .filter((c) => c.id !== "select" && c.id !== "actions")

  const headers = columns.map((c) => headerLabel(c.id, c.columnDef.header))
  const rows = table.getFilteredRowModel().rows.map((row) =>
    columns.map((c) => exportValue(c.id, row.getValue(c.id))),
  )
  return { columns, headers, rows }
}

const stamp = () => new Date().toISOString().slice(0, 10)

/* ---------------------------------- CSV ------------------------------------ */

function exportToCSV<T>(table: ReactTable<T>) {
  const { headers, rows } = collectExportData(table)
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `licenses-${stamp()}.csv`)
}

/* --------------------------------- Excel ----------------------------------- */

async function exportToXLSX<T>(table: ReactTable<T>) {
  const { columns, headers, rows } = collectExportData(table)
  const writeXlsxFile = (await import("write-excel-file/browser")).default

  const headerRow = headers.map((h) => ({
    value: h,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
    backgroundColor: "#4F46E5",
    align: "left" as const,
    alignVertical: "center" as const,
    wrap: true,
  }))

  const bodyRows = rows.map((row) =>
    row.map((value, i) =>
      columns[i]?.id === "amount"
        ? { type: Number, value: Number(value) || 0, format: "#,##0.00" }
        : { type: String, value: String(value ?? "") },
    ),
  )

  // Typed as SheetData so TS picks the raw-data overload (not the schema one).
  const data = [headerRow, ...bodyRows] as SheetData

  const result = writeXlsxFile(data, {
    // Sensible widths so columns do not collapse in Excel.
    columns: columns.map((c) =>
      c.id === "company_name" || c.id === "collector"
        ? { width: 28 }
        : c.id === "license_ref_id" || c.id === "license_area"
          ? { width: 22 }
          : { width: 16 },
    ),
    sheet: "Licenses",
    stickyRowsCount: 1,
  })

  await result.toFile("licenses-" + stamp() + ".xlsx")
}

/* ---------------------------------- PDF ------------------------------------ */

async function exportToPDF<T>(table: ReactTable<T>) {
  const { columns, headers, rows } = collectExportData(table)
  const { jsPDF } = await import("jspdf")
  const autoTable = (await import("jspdf-autotable")).default

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Title block
  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.setTextColor(30, 27, 75)
  doc.text("Mining Licenses", 32, 40)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    "Puntland State of Somalia — Ministry of Energy, Minerals & Water",
    32,
    56,
  )
  doc.text(
    `Generated ${new Date().toLocaleString()}  ·  ${rows.length} record(s)`,
    pageWidth - 32,
    56,
    { align: "right" },
  )
  doc.setDrawColor(224, 226, 240)
  doc.line(32, 66, pageWidth - 32, 66)

  const amountIndex = columns.findIndex((c) => c.id === "amount")

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? ""))),
    startY: 78,
    margin: { left: 32, right: 32, bottom: 40 },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 5,
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles:
      amountIndex >= 0 ? { [amountIndex]: { halign: "right" } } : undefined,
    didDrawPage: () => {
      const page = doc.getCurrentPageInfo().pageNumber
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(130)
      doc.text(`Page ${page}`, pageWidth - 32, pageHeight - 18, { align: "right" })
      doc.text("Mining License Management System", 32, pageHeight - 18)
    },
  })

  doc.save(`licenses-${stamp()}.pdf`)
}

/* -------------------------------- download --------------------------------- */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
