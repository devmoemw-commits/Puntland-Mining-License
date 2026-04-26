import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { approvalWorkflows } from "@/database/schema";
import { desc } from "drizzle-orm";
import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { ApprovalWorkflowsManager } from "@/components/settings/approval-workflows-manager";
import { listRoles } from "@/lib/data/get-roles";

export default async function ApprovalWorkflowsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const canView = await userHasPermission(
    session.user.id,
    session.user.role,
    Permissions.APPROVAL_WORKFLOW_VIEW,
  );

  if (!canView) {
    redirect("/?error=unauthorized");
  }

  const [canCreate, canEdit, canDelete, workflows, roles] = await Promise.all([
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.APPROVAL_WORKFLOW_CREATE,
    ),
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.APPROVAL_WORKFLOW_EDIT,
    ),
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.APPROVAL_WORKFLOW_DELETE,
    ),
    db.select().from(approvalWorkflows).orderBy(desc(approvalWorkflows.updatedAt)),
    listRoles(),
  ]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Approval workflows</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Define and manage programmable approval workflow templates.
      </p>
      <ApprovalWorkflowsManager
        workflows={workflows}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        roleOptions={roles.map((r) => ({ code: r.code, name: r.name }))}
      />
    </div>
  );
}
