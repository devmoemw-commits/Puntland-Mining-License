import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

export async function GET() {
  const denied = await requireApiPermission(Permissions.USERS_MANAGE);
  if (denied) return denied;

  const result = await db.select().from(users);
  return NextResponse.json(result);
}

