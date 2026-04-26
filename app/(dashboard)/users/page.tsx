import React from "react";

import { auth } from "@/auth";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import {
  Permissions,
  PERMISSION_DESCRIPTIONS,
  type Permission,
} from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { redirect } from "next/navigation";
import { UsersIndexTabs } from "@/components/users/users-index-tabs";
import { listRoles } from "@/lib/data/get-roles";
import { getPermissionCodesByRole } from "@/lib/data/role-permissions-map";

export type TUsers = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const permissionCatalog = (
  Object.entries(PERMISSION_DESCRIPTIONS) as [Permission, string][]
)
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.code.localeCompare(b.code));

async function getUsersList(): Promise<TUsers[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users);

  return rows.map((r) => ({
    id: r.id,
    name: r.name ?? "",
    email: r.email,
    role: r.role,
  }));
}

const Page = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (
    !(await userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.USERS_MANAGE,
    ))
  ) {
    redirect("/?error=unauthorized");
  }

  const [data, rolesList, permMap] = await Promise.all([
    getUsersList(),
    listRoles(),
    getPermissionCodesByRole(),
  ]);

  const roleDisplayNames = Object.fromEntries(
    rolesList.map((r) => [r.code, r.name]),
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">
        User administration
      </h1>
      <UsersIndexTabs
        users={data}
        roles={rolesList}
        permissionCodesByRole={permMap}
        roleDisplayNames={roleDisplayNames}
        permissionCatalog={permissionCatalog}
      />
    </div>
  );
};

export default Page;
