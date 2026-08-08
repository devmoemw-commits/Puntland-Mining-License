import { db } from "@/database/drizzle";
import { activityLogs } from "@/database/schema";
import { and, desc, eq } from "drizzle-orm";

export type ActivityLogRow = {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  summary: string | null;
  metadata: string | null;
  createdAt: string;
};

function toRow(r: typeof activityLogs.$inferSelect): ActivityLogRow {
  return {
    id: r.id,
    actorUserId: r.actorUserId,
    actorName: r.actorName,
    actorRole: r.actorRole,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    entityLabel: r.entityLabel,
    summary: r.summary,
    metadata: r.metadata,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  };
}

/** Most recent activity across all modules. */
export async function listRecentActivity(limit = 200): Promise<ActivityLogRow[]> {
  const rows = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
  return rows.map(toRow);
}

/** Activity for a single entity (e.g. one license), newest first. */
export async function listActivityForEntity(
  entityType: string,
  entityId: string,
  limit = 100,
): Promise<ActivityLogRow[]> {
  const rows = await db
    .select()
    .from(activityLogs)
    .where(
      and(
        eq(activityLogs.entityType, entityType),
        eq(activityLogs.entityId, entityId),
      ),
    )
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
  return rows.map(toRow);
}
