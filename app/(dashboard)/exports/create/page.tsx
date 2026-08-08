import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import MineralExportForm from "@/components/mineral-export-form";

export default async function CreateExportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
  if (denied) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to register exports.
      </div>
    );
  }

  return (
    <div className="my-6">
      <MineralExportForm />
    </div>
  );
}
