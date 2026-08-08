import { Permissions } from "@/lib/permissions";
import { requireActionPermission } from "@/lib/permissions-server";
import { listRecentActivity } from "@/lib/data/activity-logs";
import { ActivityLogTable } from "./_components/activity-log-table";

export default async function ActivityLogsPage() {
  const denied = await requireActionPermission(Permissions.ACTIVITY_LOG_VIEW);

  if (denied) {
    return (
      <div className="my-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Activity Logs
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view the activity log.
        </p>
      </div>
    );
  }

  const rows = await listRecentActivity(300);

  return (
    <div>
      <div className="my-5">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Activity Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          A record of key actions across licenses, samples, exports, and users.
        </p>
      </div>
      <ActivityLogTable rows={rows} />
    </div>
  );
}
