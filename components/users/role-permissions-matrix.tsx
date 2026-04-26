"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { saveRolePermissions } from "@/lib/actions/role-permissions.action";
import type { RoleRow } from "@/lib/data/get-roles";

export type PermissionCatalogItem = { code: string; label: string };

export function RolePermissionsMatrix({
  roles,
  permissionCatalog,
  permissionCodesByRole,
}: {
  roles: RoleRow[];
  permissionCatalog: PermissionCatalogItem[];
  permissionCodesByRole: Record<string, string[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, Set<string>>>(() => {
    const next: Record<string, Set<string>> = {};
    for (const r of roles) {
      next[r.code] = new Set(permissionCodesByRole[r.code] ?? []);
    }
    return next;
  });

  function toggle(role: string, code: string, checked: boolean) {
    setDraft((d) => {
      const set = new Set(d[role] ?? []);
      if (checked) set.add(code);
      else set.delete(code);
      return { ...d, [role]: set };
    });
  }

  function save(role: string) {
    startTransition(async () => {
      const res = await saveRolePermissions({
        role,
        permissionCodes: Array.from(draft[role] ?? []),
      });
      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      const data = res?.data;
      if (data && "error" in data && data.error) {
        toast.error(String(data.error));
        return;
      }
      toast.success(`Saved permissions for ${role}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 overflow-x-auto">
      <p className="text-sm text-muted-foreground max-w-3xl">
        Access is controlled by <strong>roles</strong> only: each user&apos;s role determines their
        permissions. Assign permissions to a role here, then assign users to roles on the Users tab.
      </p>
      {roles.map((r) => (
        <div key={r.code} className="rounded-xl border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-medium font-mono text-sm">{r.code}</h3>
              <p className="text-xs text-muted-foreground">{r.name}</p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => save(r.code)}
            >
              Save {r.code}
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {permissionCatalog.map((p) => (
              <label
                key={`${r.code}-${p.code}`}
                className="flex items-start gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={draft[r.code]?.has(p.code) ?? false}
                  onCheckedChange={(c) => toggle(r.code, p.code, c === true)}
                />
                <span>
                  <span className="font-mono text-xs">{p.code}</span>
                  <span className="block text-muted-foreground text-xs">{p.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
