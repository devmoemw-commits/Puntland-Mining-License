"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createApprovalWorkflow,
  deleteApprovalWorkflow,
  updateApprovalWorkflow,
} from "@/lib/actions/approval-workflows.action";

type Workflow = {
  id: string;
  module: string;
  name: string;
  description: string | null;
  definition: string;
  isActive: boolean;
};

type Props = {
  workflows: Workflow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  roleOptions: { code: string; name: string }[];
};

type WorkflowStep = {
  stepNumber: number;
  fromStatus: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";
  toStatus: "PENDING" | "REVIEW" | "APPROVED" | "REJECTED";
  roleCodes: string[];
};

const EMPTY_FORM = {
  module: "LICENSE",
  name: "",
  description: "",
  isActive: true,
};

const EMPTY_STEP: WorkflowStep = {
  stepNumber: 1,
  fromStatus: "PENDING",
  toStatus: "REVIEW",
  roleCodes: [],
};

const STATUS_OPTIONS: WorkflowStep["fromStatus"][] = [
  "PENDING",
  "REVIEW",
  "APPROVED",
  "REJECTED",
];

export function ApprovalWorkflowsManager({
  workflows,
  canCreate,
  canEdit,
  canDelete,
  roleOptions,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([{ ...EMPTY_STEP }]);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const payload = {
      ...form,
      definition: JSON.stringify(
        {
          statuses: STATUS_OPTIONS,
          steps: steps.map((s) => ({
            stepNumber: s.stepNumber,
            from: s.fromStatus,
            to: s.toStatus,
            roles: s.roleCodes,
          })),
        },
        null,
        2,
      ),
      description: form.description || undefined,
    };
    const result = editingId
      ? await updateApprovalWorkflow({ id: editingId, ...payload })
      : await createApprovalWorkflow(payload);
    setPending(false);

    if (result?.serverError || result?.validationErrors) {
      toast.error("Could not save workflow.");
      return;
    }
    if (result?.data && "error" in result.data && result.data.error) {
      toast.error(String(result.data.error));
      return;
    }
    toast.success(editingId ? "Workflow updated" : "Workflow created");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSteps([{ ...EMPTY_STEP }]);
  }

  function startEdit(item: Workflow) {
    let parsedSteps: WorkflowStep[] = [{ ...EMPTY_STEP }];
    try {
      const definition = JSON.parse(item.definition) as {
        steps?: Array<{
          name?: string;
          stepNumber?: number;
          from?: string;
          to?: string;
          roles?: string[];
        }>;
      };
      if (Array.isArray(definition.steps) && definition.steps.length > 0) {
        parsedSteps = definition.steps.map((s) => ({
          stepNumber: Number(s.stepNumber ?? s.name ?? 1),
          fromStatus: (s.from as WorkflowStep["fromStatus"]) ?? "PENDING",
          toStatus: (s.to as WorkflowStep["toStatus"]) ?? "REVIEW",
          roleCodes: Array.isArray(s.roles) ? s.roles : [],
        }));
      }
    } catch {
      parsedSteps = [{ ...EMPTY_STEP }];
    }

    setEditingId(item.id);
    setForm({
      module: item.module,
      name: item.name,
      description: item.description ?? "",
      isActive: item.isActive,
    });
    setSteps(parsedSteps);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this workflow?")) return;
    const result = await deleteApprovalWorkflow({ id });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Could not delete workflow.");
      return;
    }
    if (result?.data && "error" in result.data && result.data.error) {
      toast.error(String(result.data.error));
      return;
    }
    toast.success("Workflow deleted");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? "Edit approval workflow" : "Create approval workflow"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canCreate || (editingId && canEdit) ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Input
                  id="module"
                  value={form.module}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, module: e.target.value }))
                  }
                  placeholder="LICENSE"
                  disabled={pending || (!!editingId && !canEdit)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Default License Approval"
                  disabled={pending || (!!editingId && !canEdit)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  disabled={pending || (!!editingId && !canEdit)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Workflow steps and role assignment</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSteps((prev) => [...prev, { ...EMPTY_STEP }])}
                    disabled={pending || (!!editingId && !canEdit)}
                  >
                    Add step
                  </Button>
                </div>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={`${index}-${step.stepNumber}`} className="rounded border p-3 space-y-3">
                      <div className="grid md:grid-cols-3 gap-2">
                        <Input
                          type="number"
                          min={1}
                          placeholder="Step number"
                          value={step.stepNumber}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      stepNumber: Math.max(
                                        1,
                                        Number(e.target.value || 1),
                                      ),
                                    }
                                  : p,
                              ),
                            )
                          }
                          disabled={pending || (!!editingId && !canEdit)}
                        />
                        <select
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                          value={step.fromStatus}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      fromStatus: e.target
                                        .value as WorkflowStep["fromStatus"],
                                    }
                                  : p,
                              ),
                            )
                          }
                          disabled={pending || (!!editingId && !canEdit)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              From {status}
                            </option>
                          ))}
                        </select>
                        <select
                          className="h-9 rounded-md border bg-background px-3 text-sm"
                          value={step.toStatus}
                          onChange={(e) =>
                            setSteps((prev) =>
                              prev.map((p, i) =>
                                i === index
                                  ? {
                                      ...p,
                                      toStatus: e.target.value as WorkflowStep["toStatus"],
                                    }
                                  : p,
                              ),
                            )
                          }
                          disabled={pending || (!!editingId && !canEdit)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              To {status}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Allowed roles for this step</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {roleOptions.map((role) => (
                            <label
                              key={role.code}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                checked={step.roleCodes.includes(role.code)}
                                onCheckedChange={(checked) =>
                                  setSteps((prev) =>
                                    prev.map((p, i) => {
                                      if (i !== index) return p;
                                      const nextRoles = checked
                                        ? [...p.roleCodes, role.code]
                                        : p.roleCodes.filter((r) => r !== role.code);
                                      return { ...p, roleCodes: nextRoles };
                                    }),
                                  )
                                }
                                disabled={pending || (!!editingId && !canEdit)}
                              />
                              <span>{role.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({role.code})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSteps((prev) =>
                              prev.length > 1
                                ? prev.filter((_, i) => i !== index)
                                : [{ ...EMPTY_STEP }],
                            )
                          }
                          disabled={pending || (!!editingId && !canEdit)}
                        >
                          Remove step
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : editingId ? "Update" : "Create"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              You can view workflows but cannot create or edit them.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Defined workflows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {workflows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workflows defined yet.</p>
          ) : (
            workflows.map((item) => (
              <div key={item.id} className="rounded border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.module}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
                <div className="flex gap-2">
                  {canEdit && (
                    <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
