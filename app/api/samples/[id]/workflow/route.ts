// GET workflow view for a sample (status, next step, transitions)
import { NextResponse } from "next/server"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/database/drizzle"
import {
  approvalWorkflows,
  sampleAnalysis,
  sampleWorkflowInstances,
  sampleWorkflowTransitions,
  users,
} from "@/database/schema"
import { requireApiPermission } from "@/lib/permissions-server"
import { Permissions } from "@/lib/permissions"
import { parseWorkflowDefinition } from "@/lib/approval-workflow"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Context) {
  const denied = await requireApiPermission(Permissions.SAMPLE_ANALYSIS_ACCESS)
  if (denied) return denied

  const { id: sampleId } = await params

  try {
    const [sample] = await db
      .select({ status: sampleAnalysis.status })
      .from(sampleAnalysis)
      .where(eq(sampleAnalysis.id, sampleId))
      .limit(1)

    if (!sample) {
      return NextResponse.json({ message: "Sample not found" }, { status: 404 })
    }

    let [instanceRow] = await db
      .select({
        instance: sampleWorkflowInstances,
        workflow: approvalWorkflows,
      })
      .from(sampleWorkflowInstances)
      .innerJoin(
        approvalWorkflows,
        eq(sampleWorkflowInstances.workflowId, approvalWorkflows.id),
      )
      .where(eq(sampleWorkflowInstances.sampleId, sampleId))
      .limit(1)

    if (!instanceRow) {
      // Backfill an instance from the active SAMPLE workflow, if one exists.
      const [activeWorkflow] = await db
        .select()
        .from(approvalWorkflows)
        .where(
          and(
            eq(approvalWorkflows.module, "SAMPLE"),
            eq(approvalWorkflows.isActive, true),
          ),
        )
        .orderBy(desc(approvalWorkflows.updatedAt))
        .limit(1)

      if (activeWorkflow) {
        try {
          await db.insert(sampleWorkflowInstances).values({
            sampleId,
            workflowId: activeWorkflow.id,
            definitionSnapshot: activeWorkflow.definition,
          })
        } catch (error) {
          console.error("Failed to backfill sample workflow instance:", error)
        }

        ;[instanceRow] = await db
          .select({
            instance: sampleWorkflowInstances,
            workflow: approvalWorkflows,
          })
          .from(sampleWorkflowInstances)
          .innerJoin(
            approvalWorkflows,
            eq(sampleWorkflowInstances.workflowId, approvalWorkflows.id),
          )
          .where(eq(sampleWorkflowInstances.sampleId, sampleId))
          .limit(1)
      }
    }

    if (!instanceRow) {
      return NextResponse.json({ workflow: null, status: sample.status })
    }

    const transitionRows = await db
      .select({
        transition: sampleWorkflowTransitions,
        actorRole: users.role,
      })
      .from(sampleWorkflowTransitions)
      .leftJoin(users, eq(sampleWorkflowTransitions.actedByUserId, users.id))
      .where(eq(sampleWorkflowTransitions.instanceId, instanceRow.instance.id))
      .orderBy(desc(sampleWorkflowTransitions.createdAt))

    const definitionSource =
      instanceRow.instance.definitionSnapshot ?? instanceRow.workflow.definition
    const parsed = parseWorkflowDefinition(definitionSource)

    let nextStep: {
      kind: "TRANSITION" | "SIGNATURE"
      fromStatus: string
      toStatus: string
      allowedRoles: string[]
    } | null = null

    if (parsed) {
      // The immediate next step (by number); only actionable if it starts at the current status.
      const step = parsed.steps.find(
        (s) => s.stepNumber > instanceRow.instance.currentStepNumber,
      )
      if (step && step.from === sample.status) {
        nextStep = {
          kind: step.kind,
          fromStatus: step.from,
          toStatus: step.to,
          allowedRoles: step.roles.map((r) => r.toUpperCase()),
        }
      }
    }

    return NextResponse.json({
      status: sample.status,
      workflow: {
        workflowName: instanceRow.workflow.name,
        currentStepNumber: instanceRow.instance.currentStepNumber,
        isCompleted: instanceRow.instance.isCompleted,
        nextStep,
        transitions: transitionRows.map((row) => ({
          id: row.transition.id,
          stepNumber: row.transition.stepNumber,
          fromStatus: row.transition.fromStatus,
          toStatus: row.transition.toStatus,
          comment: row.transition.comment ?? null,
          createdAt:
            row.transition.createdAt instanceof Date
              ? row.transition.createdAt.toISOString()
              : String(row.transition.createdAt),
          actedByName: row.transition.actedByName ?? null,
          actedByRole: row.actorRole ?? null,
          actedBySignatureUrl: row.transition.actedBySignatureUrl ?? null,
        })),
      },
    })
  } catch (error) {
    console.error("Error fetching sample workflow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
