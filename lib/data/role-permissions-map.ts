import { db } from "@/database/drizzle";
import { permissions, rolePermissions, userPermissions } from "@/database/schema";
import { count, eq } from "drizzle-orm";

import {
  DEFAULT_ROLE_PERMISSIONS,
  USER_ROLES,
  isUserRole,
  type UserRole,
} from "@/lib/permissions";

/** Built-in roles only — used when the DB matrix cannot be read (e.g. migrations not applied). */
export function getStaticPermissionCodesByRole(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const role of USER_ROLES) {
    map[role] = [...DEFAULT_ROLE_PERMISSIONS[role as UserRole]];
  }
  return map;
}

function logFailedPermissionMatrixQuery(error: unknown) {
  console.error(
    "getPermissionCodesByRole: query failed; using static defaults. Fix DB/migrations if this persists.",
    error,
  );
  if (error instanceof Error && error.cause !== undefined) {
    console.error("PostgreSQL cause:", error.cause);
  }
}

/**
 * Effective permission codes for one role.
 * Uses `role_permissions` when the matrix is seeded; if the join table is empty, falls back to
 * compiled defaults for built-in roles only (bootstrap before first seed).
 */
export async function getPermissionCodesForSingleRole(
  role: string | null | undefined,
): Promise<string[]> {
  if (!role) return [];
  try {
    const [{ n }] = await db.select({ n: count() }).from(rolePermissions);
    const matrixEmpty = Number(n) === 0;
    if (matrixEmpty && isUserRole(role)) {
      return [...DEFAULT_ROLE_PERMISSIONS[role as UserRole]];
    }

    const rows = await db
      .select({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.role, role));

    return rows.map((r) => r.code);
  } catch (e) {
    logFailedPermissionMatrixQuery(e);
    return isUserRole(role) ? [...DEFAULT_ROLE_PERMISSIONS[role as UserRole]] : [];
  }
}

/** Permission codes per role code from `role_permissions` (DB source of truth). */
export async function getPermissionCodesByRole(): Promise<
  Record<string, string[]>
> {
  try {
    const rows = await db
      .select({
        role: rolePermissions.role,
        code: permissions.code,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id));

    const map: Record<string, string[]> = {};
    for (const r of rows) {
      if (!map[r.role]) map[r.role] = [];
      map[r.role].push(r.code);
    }
    return map;
  } catch (e) {
    logFailedPermissionMatrixQuery(e);
    return getStaticPermissionCodesByRole();
  }
}

/** Permission codes granted directly on a user (not via role). */
export async function getDirectPermissionCodesForUser(
  userId: string | null | undefined,
): Promise<string[]> {
  if (!userId) return [];
  try {
    const rows = await db
      .select({ code: permissions.code })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));
    return rows.map((r) => r.code);
  } catch (e) {
    logFailedPermissionMatrixQuery(e);
    return [];
  }
}

/** Union of role-based and user-direct permissions (deduplicated). */
export async function getEffectivePermissionCodesForUser(
  userId: string | null | undefined,
  role: string | null | undefined,
): Promise<string[]> {
  const roleCodes = await getPermissionCodesForSingleRole(role);
  const direct = await getDirectPermissionCodesForUser(userId);
  if (direct.length === 0) return roleCodes;
  return [...new Set([...roleCodes, ...direct])];
}
