import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { getCertificateAssets } from "@/lib/data/get-system-config";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const [canManageSystemSettings, canViewApprovalWorkflows] = await Promise.all([
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.SYSTEM_SETTINGS,
    ),
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.APPROVAL_WORKFLOW_VIEW,
    ),
  ]);

  if (!canManageSystemSettings && !canViewApprovalWorkflows) {
    redirect("/?error=unauthorized");
  }

  const assets = canManageSystemSettings ? await getCertificateAssets() : null;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">
        System configuration
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Configure organization modules and approval behavior.
      </p>
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {canManageSystemSettings && (
          <Card>
            <CardHeader>
              <CardTitle>System configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Manage certificate and organization assets.
              </p>
            </CardContent>
          </Card>
        )}
        {canViewApprovalWorkflows && (
          <Card>
            <CardHeader>
              <CardTitle>Approval workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Define programmable approval workflows before usage.
              </p>
              <Link
                className="text-sm underline underline-offset-4"
                href="/settings/approval-workflows"
              >
                Open approval workflows
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      {assets && <SystemSettingsForm initial={assets} />}
    </div>
  );
}
