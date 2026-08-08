"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LicenseStatusBadge } from "@/app/(dashboard)/licenses/_components/license-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MineralExportView } from "@/lib/data/exports";
import type { LicenseStatus } from "@/types/license-schema";

function fmt(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

export function ExportsTable({ rows }: { rows: MineralExportView[] }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.ref_id, r.company_name, r.mineral_type, r.destination_country]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by ref, company, mineral, destination…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref (RFN)</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Mineral</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Export date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.ref_id}</TableCell>
                  <TableCell>{r.company_name}</TableCell>
                  <TableCell>{r.mineral_type ?? "—"}</TableCell>
                  <TableCell>{r.destination_country ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmt(r.export_date)}</TableCell>
                  <TableCell>
                    <LicenseStatusBadge status={r.status as LicenseStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/exports/${r.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No exports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
