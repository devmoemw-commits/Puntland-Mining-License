import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import { getMineralExportById } from "@/lib/data/exports";
import { ExportView } from "./_components/export-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExportDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const denied = await requireActionPermission(Permissions.EXPORT_ACCESS);
  if (denied) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        You do not have permission to view exports.
      </div>
    );
  }

  const { id } = await params;
  const data = await getMineralExportById(id);
  if (!data) notFound();

  return (
    <div className="my-6">
      <ExportView data={data} />
    </div>
  );
}
