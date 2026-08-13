"use client"

import { useState } from "react"
import { Eye, MoreHorizontal, PauseCircle, Pencil, PlayCircle, Send, Trash2, X, XCircle } from "lucide-react"
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
import {
  AdminDeleteLicense,
  AdminSetLicenseStatus,
  SubmitLicenseDraft,
  UpdateLicenseStatus,
} from "@/lib/actions/licenses.action"
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

  // Suspend / Cancel / Reinstate / Delete are available to admins holding the moderation permission
  // (SUPER_ADMIN and ADMIN).
  const canModerate = hasPermission(Permissions.LICENSE_MODERATE)
  const isDraft = license.status === "DRAFT"

  const handleAdminStatus = async (
    target: "SUSPENDED" | "CANCELLED" | "APPROVED",
  ) => {
    setIsDropdownOpen(false)
    const verb =
      target === "SUSPENDED"
        ? "suspend"
        : target === "CANCELLED"
          ? "cancel"
          : "reinstate"
    const reason = window.prompt(`Reason for ${verb} (required):`)?.trim()
    if (!reason) {
      toast.error("A reason is required")
      return
    }

    const result = await AdminSetLicenseStatus({
      id: license.id,
      status: target,
      comment: reason,
    })
    if (result?.data?.error) {
      toast.error(String(result.data.error))
      return
    }
    toast.success(String(result?.data?.success ?? "License updated"))
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDropdownOpen(false)
    if (
      !window.confirm(
        `Permanently delete license ${license.license_ref_id}? This removes the record and its workflow, inspection and renewal history. This cannot be undone.`,
      )
    )
      return

    const result = await AdminDeleteLicense({ id: license.id })
    if (result?.data?.error) {
      toast.error(String(result.data.error))
      return
    }
    toast.success("License deleted")
    router.refresh()
  }

  const handleSubmitDraft = async () => {
    setIsDropdownOpen(false)
    const result = await SubmitLicenseDraft({ id: license.id })
    if (result?.data?.error) {
      toast.error(String(result.data.error))
      return
    }
    toast.success("Draft submitted for review")
    router.refresh()
  }

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

      const actionLabel = newStatus === "REVIEW" ? "Sending to review" : "Rejecting"
      toast.promise(UpdateLicenseStatus({ id: license.id, status: newStatus, comment }), {
        loading: `${actionLabel} license...`,
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

          {/* Draft: submit for review */}
          {isDraft && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSubmitDraft}
                className="text-indigo-600 focus:text-indigo-600 focus:bg-indigo-50 dark:focus:bg-indigo-950"
              >
                <Send className="mr-2 h-4 w-4" />
                Submit for Review
              </DropdownMenuItem>
            </>
          )}

          {/* Status update actions (not applicable to drafts) */}
          {!isDraft &&
            (hasPermission(Permissions.LICENSE_MODERATE) ||
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

          {/* Admin status overrides + delete */}
          {canModerate && (
            <>
              <DropdownMenuSeparator />
              {license.status === "APPROVED" && (
                <DropdownMenuItem
                  onClick={() => handleAdminStatus("SUSPENDED")}
                  className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950"
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Suspend
                </DropdownMenuItem>
              )}
              {license.status === "SUSPENDED" && (
                <DropdownMenuItem
                  onClick={() => handleAdminStatus("APPROVED")}
                  className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Reinstate
                </DropdownMenuItem>
              )}
              {license.status !== "CANCELLED" && !isDraft && (
                <DropdownMenuItem
                  onClick={() => handleAdminStatus("CANCELLED")}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
