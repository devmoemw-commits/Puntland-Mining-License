"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { CheckCircle, Clock, PenLine, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  SignSampleWorkflowStep,
  UpdateSampleStatus,
} from "@/lib/actions/sample.action"
import { formatDate } from "@/lib/formatDate"

type WorkflowView = {
  status: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED"
  workflow: {
    workflowName: string
    currentStepNumber: number
    isCompleted: boolean
    nextStep: {
      kind: "TRANSITION" | "SIGNATURE"
      fromStatus: string
      toStatus: string
      allowedRoles: string[]
    } | null
    transitions: {
      id: string
      stepNumber: number
      fromStatus: string
      toStatus: string
      comment: string | null
      createdAt: string
      actedByName: string | null
      actedByRole: string | null
      actedBySignatureUrl: string | null
    }[]
  } | null
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function SampleWorkflowPanel({ sampleId }: { sampleId: string }) {
  const { data: session } = useSession()
  const [view, setView] = useState<WorkflowView | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/samples/${sampleId}/workflow`, {
        cache: "no-cache",
      })
      if (!res.ok) throw new Error("Failed to load workflow")
      setView(await res.json())
    } catch (error) {
      console.error("Failed to load sample workflow:", error)
    } finally {
      setLoading(false)
    }
  }, [sampleId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading approval workflow...
        </CardContent>
      </Card>
    )
  }

  if (!view) return null

  const workflow = view.workflow
  const nextStep = workflow?.nextStep ?? null
  const userRole = (session?.user?.role ?? "").toUpperCase()
  const canAct =
    !!nextStep &&
    !workflow?.isCompleted &&
    (nextStep.allowedRoles.length === 0 || nextStep.allowedRoles.includes(userRole))
  const isSignatureStep = nextStep?.kind === "SIGNATURE"
  const nextStatus = nextStep?.toStatus?.toUpperCase()

  const handleTransition = (status: "REVIEW" | "APPROVED" | "REJECTED") => {
    if (status === "REJECTED" && !comment.trim()) {
      toast.error("Please add a comment before rejecting.")
      return
    }
    startTransition(async () => {
      const result = await UpdateSampleStatus({
        id: sampleId,
        status,
        comment: comment.trim() || undefined,
      })
      if (result?.data?.error) {
        toast.error(String(result.data.error))
        return
      }
      toast.success(`Sample ${status.toLowerCase()} successfully`)
      setComment("")
      load()
    })
  }

  const handleSign = () => {
    startTransition(async () => {
      const result = await SignSampleWorkflowStep({
        id: sampleId,
        comment: comment.trim() || undefined,
      })
      if (result?.data?.error) {
        toast.error(String(result.data.error))
        return
      }
      toast.success("Signature recorded successfully")
      setComment("")
      load()
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Approval Workflow</h2>
              {workflow ? (
                <p className="text-xs text-muted-foreground">{workflow.workflowName}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No SAMPLE workflow configured — default lifecycle applies.
                </p>
              )}
            </div>
          </div>
          <Badge className={STATUS_STYLES[view.status] ?? ""}>{view.status}</Badge>
        </div>

        {canAct ? (
          <div className="mb-4 space-y-2 rounded-lg border p-4">
            <p className="text-sm font-medium">
              {isSignatureStep
                ? "Signature required at this stage"
                : `Next step: ${nextStep?.fromStatus} → ${nextStep?.toStatus}`}
            </p>
            {!isSignatureStep && nextStatus === "REVIEW" ? (
              <Textarea
                placeholder="Optional review comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-20 text-sm"
                disabled={isPending}
              />
            ) : null}
            <div className="flex items-center gap-2">
              {isSignatureStep ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={handleSign}
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <PenLine className="mr-1 h-4 w-4" />
                  Sign
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleTransition("REJECTED")}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      handleTransition(
                        (nextStatus as "REVIEW" | "APPROVED" | "REJECTED") ??
                          "APPROVED",
                      )
                    }
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {nextStatus === "REVIEW"
                      ? "Review"
                      : nextStatus === "APPROVED"
                        ? "Approve"
                        : "Continue"}
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {workflow && workflow.transitions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">History</p>
            {workflow.transitions.map((t) => {
              const isSignature = t.fromStatus === t.toStatus
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {isSignature ? "Signed" : `${t.fromStatus} → ${t.toStatus}`}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Step {t.stepNumber}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.actedByName ?? "Unknown"}
                      {t.actedByRole ? ` (${t.actedByRole.replaceAll("_", " ")})` : ""}
                      {" · "}
                      {formatDate(t.createdAt, "dd MMMM, yyyy")}
                    </p>
                    {t.comment ? (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        “{t.comment}”
                      </p>
                    ) : null}
                  </div>
                  {t.actedBySignatureUrl ? (
                    <Image
                      src={t.actedBySignatureUrl}
                      alt="Signature"
                      width={90}
                      height={28}
                      className="h-7 w-auto shrink-0 object-contain opacity-90"
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workflow actions yet.</p>
        )}
      </CardContent>
    </Card>
  )
}
