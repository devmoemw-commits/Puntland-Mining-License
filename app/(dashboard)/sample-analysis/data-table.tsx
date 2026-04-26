"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border p-4">
      <div className="flex justify-between items-center py-4">
        <div className="flex items-center justify-between gap-6 w-full">
          <div className="flex flex-1 items-center space-x-2">
            <Input
              placeholder="Filter by company name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
              className="max-w-sm"
            />
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
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto flex items-center gap-2">
                  <SlidersHorizontal size={15} />
                  View
                </Button>
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
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
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
  )
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
function exportToCSV(table: any) {
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const escapeCSV = (value: any) => {
    if (value == null) return ""
    const stringValue = String(value).replace(/"/g, '""')
    return `"${stringValue}"`
  }

  const headers = table
    .getVisibleLeafColumns()
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    .filter((column: any) => column.id !== "select" && column.id !== "actions")
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    .map((column: any) => escapeCSV(column.columnDef.header))
    .join(",")

  const rows = table
    .getFilteredRowModel()
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    .rows.map((row: any) => {
      return row
        .getVisibleCells()
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        .filter((cell: any) => cell.column.id !== "select" && cell.column.id !== "actions")
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        .map((cell: any) => {
          if (cell.column.id === "expire_date") {
            const date = new Date(cell.getValue())
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