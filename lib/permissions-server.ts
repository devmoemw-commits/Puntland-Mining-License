import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  type Permission,
} from "@/lib/permissions";
import { getEffectivePermissionCodesForUser } from "@/lib/data/role-permissions-map";

/**
 * Effective access = permissions from the user’s **role** (`role_permissions`) plus any
 * **direct** grants (`user_permissions`).
 */
export async function userHasPermission(
  userId: string | null | undefined,
  role: string | null | undefined,
  permission: Permission,
): Promise<boolean> {
  const codes = await getEffectivePermissionCodesForUser(userId, role);
  return codes.includes(permission);
}

/** For Route Handlers: any signed-in user (e.g. listing licenses). */
export async function requireSession(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** For Route Handlers: returns a NextResponse on failure, or null if OK. */
export async function requireApiPermission(
  permission: Permission,
): Promise<NextResponse | null> {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await userHasPermission(userId, role, permission))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

/** For server actions: error string for the client, or null if allowed. */
export async function requireActionPermission(
  permission: Permission,
): Promise<"Unauthorized" | "Forbidden" | null> {
  const session = await auth();
  const role = session?.user?.role;
  const userId = session?.user?.id;

  if (!session?.user) {
    return "Unauthorized";
  }

  if (!(await userHasPermission(userId, role, permission))) {
    return "Forbidden";
  }

  return null;
}
