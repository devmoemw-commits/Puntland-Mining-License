"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export const areas = ["Bari", "Cayn", "Haylaan", "Karkaar", "Mudug", "Nugaal", "Raas Casayr", "Sanaag", "Sool"]

interface AreaMultiSelectProps {
  options?: string[]
  value: string[]
  onChange: (value: string[]) => void
}

export default function AreaMultiSelect({ options = [], value = [], onChange }: AreaMultiSelectProps) {
  const [open, setOpen] = useState(false)

  // Extract areas from options, excluding "All Puntland Areas"
  const areas = options.filter((area) => area !== "All Puntland Areas")

  const allSelected = value.includes("All Puntland Areas")
  const selectedAreas = value.filter((area) => area !== "All Puntland Areas")

  const handleAllSelect = () => {
    if (allSelected) {
      onChange([])
    } else {
      onChange(["All Puntland Areas"])
    }
  }

  const handleAreaSelect = (area: string) => {
    if (selectedAreas.includes(area)) {
      onChange(selectedAreas.filter((item) => item !== area))
    } else {
      onChange([...selectedAreas, area])
    }
  }


  const getDisplayValue = () => {
    if (allSelected) {
      return "All Puntland Areas"
    }
    if (selectedAreas.length === 0) {
      return "Select mining areas..."
    }
    if (selectedAreas.length === 1) {
      return selectedAreas[0]
    }
    return `${selectedAreas.length} areas selected`
  }

  return (
    <div className="w-full space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {getDisplayValue()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search areas..." />
            <CommandList>
              <CommandEmpty>No area found.</CommandEmpty>
              <CommandGroup>
                {/* All Puntland Areas Option */}
                <CommandItem onSelect={handleAllSelect} className="font-medium border-b">
                  <Check className={cn("mr-2 h-4 w-4", allSelected ? "opacity-100" : "opacity-0")} />
                  All Puntland Areas
                </CommandItem>

                {/* Individual Areas */}
                {areas.map((area) => (
                  <CommandItem
                    key={area}
                    onSelect={() => handleAreaSelect(area)}
                    disabled={allSelected}
                    className={allSelected ? "opacity-50" : ""}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedAreas.includes(area) ? "opacity-100" : "opacity-0")} />
                    {area}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items Display */}
      {(allSelected || selectedAreas.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {allSelected ? (
            <Badge variant="default" className="flex items-center gap-1">
              All Puntland Areas
            </Badge>
          ) : (
            selectedAreas.map((area) => (
              <Badge key={area} variant="secondary" className="flex items-center gap-1">
                {area}
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  )
}
