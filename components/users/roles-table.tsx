"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RoleRow } from "@/lib/data/get-roles";
import { createRole } from "@/lib/actions/roles.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function RolesTable({ initialRoles }: { initialRoles: RoleRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createRole({
      code,
      name,
      description: description || undefined,
    });
    setPending(false);
    if (res?.serverError) {
      toast.error(res.serverError);
      return;
    }
    if (res?.validationErrors) {
      toast.error("Fix validation errors");
      return;
    }
    const data = res?.data;
    if (data && "error" in data && data.error) {
      toast.error(String(data.error));
      return;
    }
    toast.success("Role created. Assign permissions via DB or re-run permission sync if you use scripts.");
    setOpen(false);
    setCode("");
    setName("");
    setDescription("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create role</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>New role</DialogTitle>
                <DialogDescription>
                  Code must be UPPER_SNAKE_CASE. After creation, grant permissions
                  (e.g. link in <code className="text-xs">role_permissions</code>) so
                  the role can access features.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="role-code">Code</Label>
                  <Input
                    id="role-code"
                    placeholder="FIELD_AGENT"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-name">Display name</Label>
                  <Input
                    id="role-name"
                    placeholder="Field agent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-desc">Description (optional)</Label>
                  <Textarea
                    id="role-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialRoles.map((r) => (
            <TableRow key={r.code}>
              <TableCell className="font-mono text-xs">{r.code}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm max-w-md">
                {r.description ?? "—"}
              </TableCell>
              <TableCell>
                {r.isSystem ? (
                  <Badge variant="secondary">System</Badge>
                ) : (
                  <Badge variant="outline">Custom</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
