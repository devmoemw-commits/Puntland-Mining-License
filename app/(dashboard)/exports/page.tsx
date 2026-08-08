import Link from "next/link";
import { Plus } from "lucide-react";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import { listMineralExports } from "@/lib/data/exports";
import { ExportsTable } from "./_components/exports-table";

export default async function ExportsPage() {
  const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
  if (denied) {
    return (
      <div className="my-6 text-sm text-muted-foreground">
        You do not have permission to access the Mineral Export module.
      </div>
    );
  }

  const rows = await listMineralExports();

  return (
    <div>
      <div className="my-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Mineral Exports
          </h1>
          <p className="text-sm text-muted-foreground">
            Mineral Export Registration Forms (Foomka Diiwaangelinta Macdanta La Dhoofinayo)
          </p>
        </div>
        <Link
          href="/exports/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-indigo-800"
        >
          <span>New Export</span>
          <Plus className="h-4 w-4" />
        </Link>
      </div>
      <ExportsTable rows={rows} />
    </div>
  );
}
