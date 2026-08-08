import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  listNotificationsForUser,
  unreadNotificationCount,
} from "@/lib/data/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unread] = await Promise.all([
    listNotificationsForUser(session.user.id),
    unreadNotificationCount(session.user.id),
  ]);

  return NextResponse.json({ items, unread });
}
