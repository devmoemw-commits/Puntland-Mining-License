"use client"

import { useState } from "react"
import { Eye, MoreHorizontal, Pencil, X } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { UpdateLicenseStatus } from "@/lib/actions/licenses.action"
import type { License } from "../column"
import { Permissions } from "@/lib/permissions"

interface LicenseActionsCellProps {
  license: License
}

export function LicenseActionsCell({ license }: LicenseActionsCellProps) {
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const permissionCodes = session?.user?.permissionCodes ?? []
  const hasPermission = (permission: string) => permissionCodes.includes(permission)

  // Handle status update
  const handleStatusUpdate = async (newStatus: "REVIEW" | "REJECTED") => {
    try {
      // Close dropdown when performing action
      setIsDropdownOpen(false)
      const comment =
        newStatus === "REVIEW"
          ? window.prompt("Add review comment (required):")?.trim()
          : undefined

      if (newStatus === "REVIEW" && !comment) {
        toast.error("Review comment is required")
        return
      }

      toast.promise(UpdateLicenseStatus({ id: license.id, status: newStatus, comment }), {
        loading: `${newStatus === "APPROVED" ? "Approving" : newStatus === "REVIEW" ? "Sending to review" : "Rejecting"} license...`,
        success: () => {
          router.refresh()
          return `License ${newStatus.toLowerCase()} successfully`
        },
        error: (error) => {
          console.error("Status update error:", error)
          return "Failed to update license status"
        },
      })
    } catch (error) {
      console.error("Unexpected error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  // Handle copy to clipboard
  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(license.license_ref_id)
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
            <Link href={`/licenses/${license.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/licenses/edit/${license.id}`} className="flex items-center">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>

          {/* Status update actions */}
          {(hasPermission(Permissions.LICENSE_MODERATE) ||
            hasPermission(Permissions.LICENSE_REVIEW) ||
            hasPermission(Permissions.LICENSE_APPROVE) ||
            hasPermission(Permissions.LICENSE_REJECT)) && (
            <>
              <DropdownMenuSeparator />
              {license.status === "PENDING" && (
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate("REVIEW")}
                  className="text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Send To Review
                </DropdownMenuItem>
              )}
              {license.status === "REVIEW" && (
                <DropdownMenuItem
                  onClick={() => handleStatusUpdate("REJECTED")}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
