import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  type LucideIcon,
  Stamp,
  Tags,
  Workflow,
} from "lucide-react";

import { Permissions } from "@/lib/permissions";
import { userHasPermission } from "@/lib/permissions-server";
import { getCertificateAssets } from "@/lib/data/get-system-config";
import { SystemSettingsForm } from "@/components/settings/system-settings-form";

type SettingsLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

function SettingsCard({ item }: { item: SettingsLink }) {
  return (
    <Link
      href={item.href}
      className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:hover:border-indigo-800"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300">
        <item.icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{item.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
    </Link>
  );
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const [canManageSystemSettings, canViewApprovalWorkflows] = await Promise.all([
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.SYSTEM_SETTINGS,
    ),
    userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.APPROVAL_WORKFLOW_VIEW,
    ),
  ]);

  if (!canManageSystemSettings && !canViewApprovalWorkflows) {
    redirect("/?error=unauthorized");
  }

  const assets = canManageSystemSettings ? await getCertificateAssets() : null;

  const settingsLinks: SettingsLink[] = [
    ...(canManageSystemSettings
      ? [
          {
            title: "License Categories",
            description:
              "Predefined license categories and their New License / Renewal fees.",
            href: "/settings/license-categories",
            icon: Tags,
          },
          {
            title: "Business Types",
            description:
              "Predefined company business types used in the application form.",
            href: "/settings/business-types",
            icon: Building2,
          },
        ]
      : []),
    ...(canViewApprovalWorkflows
      ? [
          {
            title: "Approval Workflows",
            description:
              "Programmable approval steps, signature steps, and role assignments.",
            href: "/settings/approval-workflows",
            icon: Workflow,
          },
        ]
      : []),
  ];

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage organization configuration, predefined lists, and approval
          behavior.
        </p>
      </div>

      {settingsLinks.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Configuration
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {settingsLinks.map((item) => (
              <SettingsCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      )}

      {assets && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Stamp className="size-4" />
            Certificate assets
          </h2>
          <SystemSettingsForm initial={assets} />
        </section>
      )}
    </div>
  );
}
