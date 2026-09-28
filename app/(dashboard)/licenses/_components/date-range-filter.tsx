"use client"

import { useState } from "react"
import type { Column } from "@tanstack/react-table"
import { CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

/** Filter value stored on the column. Absolute ISO bounds so the row filter stays trivial. */
export type DateRangeValue = {
  from?: string
  to?: string
  label?: string
}

const startOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
const endOfDay = (d: Date) => {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Presets are resolved to concrete bounds at click time (not per row). */
function presetRange(key: "today" | "week" | "month" | "year"): DateRangeValue {
  const now = new Date()
  const to = endOfDay(now).toISOString()

  if (key === "today") {
    return { from: startOfDay(now).toISOString(), to, label: "Today" }
  }
  if (key === "week") {
    const from = startOfDay(now)
    // Week starts Monday.
    from.setDate(from.getDate() - ((from.getDay() + 6) % 7))
    return { from: from.toISOString(), to, label: "This week" }
  }
  if (key === "month") {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    return { from: from.toISOString(), to, label: "This month" }
  }
  const from = startOfDay(new Date(now.getFullYear(), 0, 1))
  return { from: from.toISOString(), to, label: "This year" }
}

interface Props<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
}

export function DataTableDateFilter<TData, TValue>({
  column,
  title = "Date",
}: Props<TData, TValue>) {
  const active = column?.getFilterValue() as DateRangeValue | undefined
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const applyCustom = (nextFrom: string, nextTo: string) => {
    if (!nextFrom && !nextTo) {
      column?.setFilterValue(undefined)
      return
    }
    column?.setFilterValue({
      from: nextFrom ? new Date(`${nextFrom}T00:00:00`).toISOString() : undefined,
      to: nextTo ? new Date(`${nextTo}T23:59:59.999`).toISOString() : undefined,
      label:
        nextFrom && nextTo
          ? `${nextFrom} → ${nextTo}`
          : nextFrom
            ? `From ${nextFrom}`
            : `Until ${nextTo}`,
    })
  }

  const setPreset = (key: "today" | "week" | "month" | "year") => {
    setFrom("")
    setTo("")
    column?.setFilterValue(presetRange(key))
  }

  const clear = () => {
    setFrom("")
    setTo("")
    column?.setFilterValue(undefined)
  }

  return (
    <Popover>
      <PopoverTrigger
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "h-8 border-dashed",
        })}
      >
        <CalendarDays className="mr-2 h-4 w-4" />
        {title}
        {active?.label ? (
          <>
            <Separator orientation="vertical" className="mx-2 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal">
              {active.label}
            </Badge>
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPreset("today")}>
            Today
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreset("week")}>
            This week
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreset("month")}>
            This month
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPreset("year")}>
            This year
          </Button>
        </div>

        <Separator className="my-3" />

        <p className="mb-2 text-xs font-medium text-muted-foreground">Custom range</p>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              className="h-8"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                applyCustom(e.target.value, to)
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              className="h-8"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                applyCustom(from, e.target.value)
              }}
            />
          </div>
        </div>

        {active ? (
          <>
            <Separator className="my-3" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={clear}
            >
              Clear date filter
            </Button>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
