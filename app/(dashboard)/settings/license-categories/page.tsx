import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { listLicenseCategories } from "@/lib/data/get-license-categories";
import { LicenseCategoriesManager } from "@/components/settings/license-categories-manager";

export default async function LicenseCategoriesPage() {
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

  const categories = await listLicenseCategories();

  return (
    <div className="container mx-auto py-8 px-4 space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">
        License categories
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Predefined categories used in the license application form. Edit names
        and fees, add new categories, or deactivate ones no longer offered.
      </p>
      <LicenseCategoriesManager categories={categories} canManage={canManage} />
    </div>
  );
}
