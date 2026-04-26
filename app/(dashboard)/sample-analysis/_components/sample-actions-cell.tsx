"use client"

import { useState } from "react"
import { Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"

export type TSample = {
  id: string
  ref_id: string
  name: string
  passport_no: string
  kilo_gram: string
  created_at?: string
  updated_at?: string
}

interface SampleActionsCellProps {
  sample: TSample
}

export function SampleActionsCell({ sample }: SampleActionsCellProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Handle copy to clipboard
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(sample.ref_id)
      toast.success("ID copied to clipboard")
    } catch (error) {
      toast.error("Failed to copy ID" + error)
    }
  }

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleCopyId}>Copy ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/sample-analysis/${sample.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
