"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLogRow } from "@/lib/data/activity-logs";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const ENTITY_COLORS: Record<string, string> = {
  license: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  sample: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  export: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  user: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

export function ActivityLogTable({ rows }: { rows: ActivityLogRow[] }) {
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState<string>("ALL");

  const entityTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entityType))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (entityType !== "ALL" && r.entityType !== entityType) return false;
      if (!q) return true;
      return [r.actorName, r.action, r.summary, r.entityLabel, r.entityType]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [rows, search, entityType]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search activity (actor, action, summary)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All types</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} of {rows.length} entries
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatWhen(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{r.actorName ?? "System"}</div>
                    {r.actorRole ? (
                      <div className="text-xs text-muted-foreground">
                        {r.actorRole.replaceAll("_", " ")}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{r.action}</code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        ENTITY_COLORS[r.entityType] ??
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }
                    >
                      {r.entityType}
                    </Badge>
                    {r.entityLabel ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {r.entityLabel}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-md">{r.summary}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No activity found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
