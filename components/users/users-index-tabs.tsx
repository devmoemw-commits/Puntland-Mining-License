"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import UsersList from "@/components/users-list";
import { RolesTable } from "@/components/users/roles-table";
import {
  RolePermissionsMatrix,
  type PermissionCatalogItem,
} from "@/components/users/role-permissions-matrix";
import type { TUsers } from "@/app/(dashboard)/users/page";
import type { RoleRow } from "@/lib/data/get-roles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import SignUpForm from "@/app/(auth)/_components/sign-up";

type Props = {
  users: TUsers[];
  roles: RoleRow[];
  permissionCodesByRole: Record<string, string[]>;
  roleDisplayNames: Record<string, string>;
  permissionCatalog: PermissionCatalogItem[];
};

export function UsersIndexTabs({
  users,
  roles,
  permissionCodesByRole,
  roleDisplayNames,
  permissionCatalog,
}: Props) {
  return (
    <Tabs defaultValue="users" className="w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="users" className="mt-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Accounts</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Create user</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
                <DialogDescription>
                  Add a new user to the system.
                </DialogDescription>
              </DialogHeader>
              <SignUpForm
                roles={roles}
                permissionCatalog={permissionCatalog}
              />
              <DialogFooter />
            </DialogContent>
          </Dialog>
        </div>
        <UsersList
          data={users}
          userCount={users.length}
          permissionCodesByRole={permissionCodesByRole}
          roleDisplayNames={roleDisplayNames}
        />
      </TabsContent>

      <TabsContent value="roles" className="mt-6 space-y-8">
        <div>
          <h2 className="text-lg font-medium mb-1">Roles</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Create custom roles below. Permissions are assigned per role in the matrix — users
            inherit permissions from their role only.
          </p>
        </div>
        <RolesTable initialRoles={roles} />
        <div>
          <h2 className="text-lg font-medium mb-1">Role permissions</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mb-4">
            Check the capabilities each role should have, then save. Run{" "}
            <code className="text-xs">npm run db:seed:permissions</code> if new permission codes
            were added in a deploy.
          </p>
          <RolePermissionsMatrix
            roles={roles}
            permissionCatalog={permissionCatalog}
            permissionCodesByRole={permissionCodesByRole}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
