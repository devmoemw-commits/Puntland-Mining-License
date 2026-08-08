import "server-only";

import { db } from "@/database/drizzle";
import { notifications, users } from "@/database/schema";
import { inArray } from "drizzle-orm";

export type CreateNotificationParams = {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  /** When set, prevents duplicate notifications for the same user + key. */
  dedupeKey?: string | null;
};

/** Create one notification (deduped when dedupeKey is provided). Never throws. */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await db
      .insert(notifications)
      .values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        dedupeKey: params.dedupeKey ?? null,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/** Fan a notification out to every user holding one of the given roles. */
export async function notifyRoles(
  roles: string[],
  params: Omit<CreateNotificationParams, "userId">,
): Promise<string[]> {
  try {
    const recipients = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, roles));

    await Promise.all(
      recipients.map((r) =>
        createNotification({
          ...params,
          userId: r.id,
          dedupeKey: params.dedupeKey ? `${params.dedupeKey}:${r.id}` : null,
        }),
      ),
    );
    return recipients.map((r) => r.id);
  } catch (error) {
    console.error("Failed to notify roles:", error);
    return [];
  }
}
