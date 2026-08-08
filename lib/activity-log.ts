import "server-only";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { activityLogs } from "@/database/schema";

export type LogActivityParams = {
  /** Machine action code, e.g. "license.status_change". */
  action: string;
  /** Entity kind: "license" | "sample" | "user" | "export" | "role" | etc. */
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Optional actor overrides; defaults to the current session user. */
  actorUserId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
};

/**
 * Append one row to the activity log. Never throws — logging must not break the
 * action that triggered it. Resolves the acting user from the session unless overridden.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    let actorUserId = params.actorUserId ?? null;
    let actorName = params.actorName ?? null;
    let actorRole = params.actorRole ?? null;

    if (params.actorUserId === undefined) {
      const session = await auth();
      actorUserId = session?.user?.id ?? null;
      actorName = actorName ?? session?.user?.name ?? null;
      actorRole = actorRole ?? (session?.user?.role as string | undefined) ?? null;
    }

    await db.insert(activityLogs).values({
      actorUserId,
      actorName,
      actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      entityLabel: params.entityLabel ?? null,
      summary: params.summary ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}
