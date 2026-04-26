/**
 * Seeds `permissions` and `role_permissions` from `lib/permissions.ts`.
 * Does not create users — roles live in the `roles` table (created via migrations / UI).
 *
 * Re-run to ensure permissions exist and add missing `role_permissions` rows (does not delete existing links).
 */

import "dotenv/config";
import { inArray } from "drizzle-orm";
import { db } from "../drizzle";
import { permissions, rolePermissions } from "../schema";
import {
  DEFAULT_ROLE_PERMISSIONS,
  Permissions,
  PERMISSION_DESCRIPTIONS,
  type Permission,
} from "../../lib/permissions";

async function seedPermissions() {
  console.log("🔐 Seeding permissions and role_permissions…");

  const codes = Object.values(Permissions) as Permission[];

  await db.insert(permissions).values(
    codes.map((code) => ({
      code,
      description: PERMISSION_DESCRIPTIONS[code],
    })),
  ).onConflictDoNothing({ target: permissions.code });

  const rows = await db.select().from(permissions).where(inArray(permissions.code, codes));

  const idByCode = new Map<string, string>();
  for (const row of rows) {
    idByCode.set(row.code, row.id);
  }

  for (const code of codes) {
    if (!idByCode.has(code)) {
      throw new Error(`Missing permission row for code: ${code}`);
    }
  }

  const rolePermRows: { role: string; permissionId: string }[] = [];

  for (const role of Object.keys(DEFAULT_ROLE_PERMISSIONS) as (keyof typeof DEFAULT_ROLE_PERMISSIONS)[]) {
    for (const code of DEFAULT_ROLE_PERMISSIONS[role]) {
      const permissionId = idByCode.get(code);
      if (!permissionId) {
        throw new Error(`No id for permission ${code}`);
      }
      rolePermRows.push({ role, permissionId });
    }
  }

  if (rolePermRows.length > 0) {
    await db
      .insert(rolePermissions)
      .values(rolePermRows)
      .onConflictDoNothing({ target: [rolePermissions.role, rolePermissions.permissionId] });
  }

  console.log(
    `✅ Done. ${rows.length} permissions, ${rolePermRows.length} role_permissions rows.`,
  );
}

seedPermissions().catch((err) => {
  console.error(err);
  process.exit(1);
});
