"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  FileText,
  History,
  Plus,
  ScrollText,
} from "lucide-react";

import LicenseDetails from "@/components/license-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Permissions } from "@/lib/permissions";
import {
  CreateInspectionReport,
  CreateLicenseRenewal,
} from "@/lib/actions/license-extras.action";
import type {
  InspectionReportRow,
  RenewalRow,
} from "@/lib/data/license-extras";
import type { ActivityLogRow } from "@/lib/data/activity-logs";
import { ActivityLogTable } from "@/app/(dashboard)/activity-logs/_components/activity-log-table";

type LicenseDetailsProps = React.ComponentProps<typeof LicenseDetails>;

interface Props extends LicenseDetailsProps {
  inspections: InspectionReportRow[];
  renewals: RenewalRow[];
  activity: ActivityLogRow[];
}

function fmtDate(v: string | null): string {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString();
}

export function LicenseDetailTabs({
  inspections,
  renewals,
  activity,
  ...detailsProps
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const codes = session?.user?.permissionCodes ?? [];
  const canReview = codes.includes(Permissions.LICENSE_REVIEW);
  const canModerate = codes.includes(Permissions.LICENSE_MODERATE);

  const licenseId = detailsProps.license.id;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="flex flex-wrap h-auto">
        <TabsTrigger value="overview">
          <FileText className="mr-1.5 h-4 w-4" /> Overview
        </TabsTrigger>
        <TabsTrigger value="inspections">
          <ClipboardCheck className="mr-1.5 h-4 w-4" /> Inspection Reports
          {inspections.length ? (
            <Badge variant="secondary" className="ml-1.5">{inspections.length}</Badge>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="renewals">
          <History className="mr-1.5 h-4 w-4" /> Renewal History
          {renewals.length ? (
            <Badge variant="secondary" className="ml-1.5">{renewals.length}</Badge>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="activity">
          <ScrollText className="mr-1.5 h-4 w-4" /> Activity Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        {/* Applicant, Documents, Payment, Certificate & Workflow live in the existing view. */}
        <LicenseDetails {...detailsProps} />
      </TabsContent>

      <TabsContent value="inspections" className="mt-4 space-y-6">
        {canReview && (
          <InspectionForm
            licenseId={licenseId}
            onDone={() => router.refresh()}
          />
        )}
        <InspectionList rows={inspections} />
      </TabsContent>

      <TabsContent value="renewals" className="mt-4 space-y-6">
        {canModerate && (
          <RenewalForm licenseId={licenseId} onDone={() => router.refresh()} />
        )}
        <RenewalList rows={renewals} />
      </TabsContent>

      <TabsContent value="activity" className="mt-4">
        <ActivityLogTable rows={activity} />
      </TabsContent>
    </Tabs>
  );
}

/* ---------------------------- Inspection Reports ---------------------------- */

function InspectionForm({
  licenseId,
  onDone,
}: {
  licenseId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    inspectionDate: "",
    inspectorName: "",
    gpsVerified: false,
    recommendation: "",
    notes: "",
  });

  const submit = async () => {
    if (!form.inspectorName.trim()) {
      toast.error("Inspector name is required");
      return;
    }
    setSaving(true);
    const res = await CreateInspectionReport({
      licenseId,
      inspectionDate: form.inspectionDate || undefined,
      inspectorName: form.inspectorName,
      gpsVerified: form.gpsVerified,
      recommendation:
        (form.recommendation as "APPROVE" | "REJECT" | "MORE_INFO") || undefined,
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (res?.data?.error) {
      toast.error(String(res.data.error));
      return;
    }
    toast.success("Inspection report added");
    setForm({
      inspectionDate: "",
      inspectorName: "",
      gpsVerified: false,
      recommendation: "",
      notes: "",
    });
    setOpen(false);
    onDone();
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-4 w-4" /> Add Inspection Report
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-medium">New Inspection Report</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Inspection date</Label>
          <Input
            type="date"
            value={form.inspectionDate}
            onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Inspector name *</Label>
          <Input
            value={form.inspectorName}
            onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Recommendation</Label>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.recommendation}
            onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
          >
            <option value="">—</option>
            <option value="APPROVE">Approve</option>
            <option value="REJECT">Reject</option>
            <option value="MORE_INFO">Need more information</option>
          </select>
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm">
          <input
            type="checkbox"
            checked={form.gpsVerified}
            onChange={(e) => setForm({ ...form, gpsVerified: e.target.checked })}
          />
          GPS coordinates verified on site
        </label>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Findings, observations…"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving} size="sm">
          {saving ? "Saving…" : "Save report"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function InspectionList({ rows }: { rows: InspectionReportRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No inspection reports recorded yet.
      </p>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Inspector</TableHead>
            <TableHead>GPS</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Recorded by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{fmtDate(r.inspectionDate)}</TableCell>
              <TableCell>{r.inspectorName ?? "—"}</TableCell>
              <TableCell>
                {r.gpsVerified ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Verified
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>{r.recommendation?.replace("_", " ") ?? "—"}</TableCell>
              <TableCell className="max-w-xs whitespace-pre-wrap">{r.notes ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {r.createdByName ?? "—"}
                <div>{fmtDate(r.createdAt)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------ Renewal History ---------------------------- */

function RenewalForm({
  licenseId,
  onDone,
}: {
  licenseId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    newExpireDate: "",
    fee: "",
    receiptNumber: "",
    notes: "",
  });

  const submit = async () => {
    if (!form.newExpireDate) {
      toast.error("New expiry date is required");
      return;
    }
    setSaving(true);
    const res = await CreateLicenseRenewal({
      licenseId,
      newExpireDate: form.newExpireDate,
      fee: form.fee || undefined,
      receiptNumber: form.receiptNumber || undefined,
      notes: form.notes || undefined,
    });
    setSaving(false);
    if (res?.data?.error) {
      toast.error(String(res.data.error));
      return;
    }
    toast.success("License renewed");
    setForm({ newExpireDate: "", fee: "", receiptNumber: "", notes: "" });
    setOpen(false);
    onDone();
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-1.5 h-4 w-4" /> Record Renewal
      </Button>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-medium">Record Renewal</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>New expiry date *</Label>
          <Input
            type="date"
            value={form.newExpireDate}
            onChange={(e) => setForm({ ...form, newExpireDate: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Renewal fee</Label>
          <Input
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
            placeholder="e.g. 500.00"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Receipt number</Label>
          <Input
            value={form.receiptNumber}
            onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving} size="sm">
          {saving ? "Saving…" : "Save renewal"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RenewalList({ rows }: { rows: RenewalRow[] }) {
  if (!rows.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No renewals recorded yet.
      </p>
    );
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Renewed on</TableHead>
            <TableHead>Previous expiry</TableHead>
            <TableHead>New expiry</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{fmtDate(r.createdAt)}</TableCell>
              <TableCell className="whitespace-nowrap">{fmtDate(r.previousExpireDate)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium">{fmtDate(r.newExpireDate)}</TableCell>
              <TableCell>{r.fee ?? "—"}</TableCell>
              <TableCell>{r.receiptNumber ?? "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{r.createdByName ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
