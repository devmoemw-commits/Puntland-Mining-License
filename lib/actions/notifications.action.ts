"use server";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { notifications } from "@/database/schema";
import { and, eq, isNull } from "drizzle-orm";

/** Mark a single notification as read (only the owner's own). */
export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
    return { success: true };
  } catch (e) {
    console.error("markNotificationRead failed", e);
    return { error: "Failed to update notification" };
  }
}

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  try {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, session.user.id),
          isNull(notifications.readAt),
        ),
      );
    return { success: true };
  } catch (e) {
    console.error("markAllNotificationsRead failed", e);
    return { error: "Failed to update notifications" };
  }
}
