"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TUsers } from "@/app/(dashboard)/users/page";
import Link from "next/link";
import { PencilIcon } from "lucide-react";
import { Button } from "./ui/button";

import { Badge } from "@/components/ui/badge";
import {
  getPermissionsForRoleDisplay,
  isUserRole,
  PERMISSION_DESCRIPTIONS,
  ROLE_LABELS,
  type Permission,
} from "@/lib/permissions";

function permissionLabel(code: string) {
  return PERMISSION_DESCRIPTIONS[code as Permission] ?? code;
}

const UsersList = ({
  data,
  userCount,
  permissionCodesByRole = {},
  roleDisplayNames = {},
}: {
  data: TUsers[];
  userCount: number;
  permissionCodesByRole?: Record<string, string[]>;
  roleDisplayNames?: Record<string, string>;
}) => {
  return (
    <div>
      <Table>
        <TableCaption>A list of users in the system</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="min-w-[220px]">Permissions</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user: TUsers) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {roleDisplayNames[user.role] ??
                    (isUserRole(user.role) ? ROLE_LABELS[user.role] : user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1 max-w-md">
                  {(
                    permissionCodesByRole[user.role] ??
                    getPermissionsForRoleDisplay(user.role).map((p) => p.code)
                  ).map((code) => (
                    <Badge
                      key={code}
                      variant="outline"
                      className="text-[10px] font-normal leading-tight max-w-[200px] whitespace-normal h-auto py-0.5"
                      title={permissionLabel(code)}
                    >
                      {code}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2 flex items-center justify-center gap-3">
                {userCount > 1 ? (
                  <Link href={`/users/${user.id}`}>
                    <Button variant="outline" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled={userCount === 1}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersList;
