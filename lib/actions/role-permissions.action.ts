"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/database/drizzle";
import { permissions, rolePermissions, roles } from "@/database/schema";
import { actionClient } from "@/lib/safe-action";
import { requireActionPermission } from "@/lib/permissions-server";
import { Permissions } from "@/lib/permissions";

const saveSchema = z.object({
  role: z.string().min(1).max(64),
  permissionCodes: z.array(z.string().min(1)),
});

const allValidCodes = new Set(Object.values(Permissions) as string[]);

/**
 * Replaces all permission grants for a role (junction table `role_permissions` only).
 * Users still receive access only through their assigned role — there are no per-user permission rows.
 */
export const saveRolePermissions = actionClient
  .schema(saveSchema)
  .action(async ({ parsedInput }) => {
    const denied = await requireActionPermission(Permissions.USERS_MANAGE);
    if (denied) return { error: denied };

    const { role, permissionCodes } = parsedInput;

    const [roleRow] = await db
      .select({ code: roles.code })
      .from(roles)
      .where(eq(roles.code, role))
      .limit(1);
    if (!roleRow) {
      return { error: "Role not found. Create the role first." };
    }

    for (const c of permissionCodes) {
      if (!allValidCodes.has(c)) {
        return { error: `Invalid permission code: ${c}` };
      }
    }

    const permRows =
      permissionCodes.length === 0
        ? []
        : await db
            .select({ id: permissions.id, code: permissions.code })
            .from(permissions)
            .where(inArray(permissions.code, permissionCodes));

    if (permRows.length !== permissionCodes.length) {
      return {
        error:
          "Some permissions are missing in the database. Run: npm run db:seed:permissions",
      };
    }

    await db.delete(rolePermissions).where(eq(rolePermissions.role, role));

    if (permRows.length > 0) {
      await db.insert(rolePermissions).values(
        permRows.map((p) => ({ role, permissionId: p.id })),
      );
    }

    revalidatePath("/users");
    return { success: true as const };
  });
