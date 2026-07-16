import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Stamp } from "lucide-react";

import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { getCertificateAssets } from "@/lib/data/get-system-config";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const canManageSystemSettings = await userHasPermission(
    session.user.id,
    session.user.role,
    Permissions.SYSTEM_SETTINGS,
  );

  if (!canManageSystemSettings) {
    redirect("/?error=unauthorized");
  }

  const assets = await getCertificateAssets();

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organization-level configuration. License categories, business types,
          and approval workflows have their own pages in the sidebar.
        </p>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          <Stamp className="size-4" />
          Certificate assets
        </h2>
        <SystemSettingsForm initial={assets} />
      </section>
    </div>
  );
}
