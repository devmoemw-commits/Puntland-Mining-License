import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { listBusinessTypes } from "@/lib/data/get-business-types";
import { BusinessTypesManager } from "@/components/settings/business-types-manager";

export default async function BusinessTypesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const canManage = await userHasPermission(
    session.user.id,
    session.user.role,
    Permissions.SYSTEM_SETTINGS,
  );

  if (!canManage) {
    redirect("/?error=unauthorized");
  }

  const types = await listBusinessTypes();

  return (
    <div className="container mx-auto py-8 px-4 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Business types</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Predefined business types used in the license application form. Edit
        names, add new types, or deactivate ones no longer offered.
      </p>
      <BusinessTypesManager types={types} canManage={canManage} />
    </div>
  );
}
