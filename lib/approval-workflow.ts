/**
 * Shared approval-workflow definition parsing, used by both the license and
 * sample-analysis workflow engines. Definitions are stored as JSON on
 * `approval_workflows.definition` (and snapshotted per instance).
 */

export type WorkflowStatus = "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";

/** "TRANSITION" changes the record status; "SIGNATURE" collects a signature without changing status. */
export type WorkflowStepKind = "TRANSITION" | "SIGNATURE";

export type WorkflowStepDefinition = {
  stepNumber: number;
  kind: WorkflowStepKind;
  from: WorkflowStatus;
  to: WorkflowStatus;
  roles: string[];
};

export type WorkflowDefinition = {
  steps: WorkflowStepDefinition[];
};

const VALID_STATUSES: readonly string[] = [
  "PENDING",
  "REVIEW",
  "APPROVED",
  "REJECTED",
];

export function parseWorkflowDefinition(
  definition: string,
): WorkflowDefinition | null {
  try {
    const parsed = JSON.parse(definition) as {
      steps?: Array<{
        stepNumber?: number;
        kind?: string;
        from?: string;
        to?: string;
        roles?: string[];
      }>;
    };
    if (!Array.isArray(parsed.steps)) return null;

    const steps = parsed.steps
      .map((step) => {
        // Steps without an explicit kind are legacy status transitions.
        const kind: WorkflowStepKind =
          step.kind === "SIGNATURE" ? "SIGNATURE" : "TRANSITION";
        // A signature step never changes status, so its target equals its source status.
        const from = step.from as WorkflowStatus;
        const to = kind === "SIGNATURE" ? from : (step.to as WorkflowStatus);
        return {
          stepNumber: Number(step.stepNumber),
          kind,
          from,
          to,
          roles: Array.isArray(step.roles)
            ? step.roles.map((r) => String(r).trim()).filter(Boolean)
            : [],
        };
      })
      .filter(
        (step) =>
          Number.isFinite(step.stepNumber) &&
          step.stepNumber > 0 &&
          VALID_STATUSES.includes(step.from) &&
          VALID_STATUSES.includes(step.to),
      )
      .sort((a, b) => a.stepNumber - b.stepNumber);

    if (!steps.length) return null;
    return { steps };
  } catch {
    return null;
  }
}
