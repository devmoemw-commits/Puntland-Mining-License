"use client";

import type * as React from "react";
import {
  FileBadge,
  FileLineChartIcon as FileChartLine,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Plus,
  TestTube2,
  Users,
  Settings,
  Workflow,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  ROUTE_PERMISSION_RULES,
  type Permission,
  sessionHasAnyPermission,
} from "@/lib/permissions";

// Define types for our navigation items
type SubNavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  /** If omitted, inherits parent `permissions` (if any). */
  permissions?: readonly Permission[];
};

type NavItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  section?: "main" | "management";
  children?: SubNavItem[];
  /** If omitted, any signed-in user can see the item. */
  permissions?: readonly Permission[];
};

// Align with `ROUTE_PERMISSION_RULES` in lib/permissions.ts
const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    title: "Licenses",
    path: "/licenses",
    icon: FileBadge,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/licenses"],
    children: [
      {
        title: "Licenses List",
        path: "/licenses",
        icon: FileText,
      },
      {
        title: "Create License",
        path: "/licenses/create",
        icon: Plus,
      },
    ],
  },
  {
    title: "Sample Analysis",
    path: "/sample-analysis",
    icon: TestTube2,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/sample-analysis"],
    children: [
      {
        title: "Sample List",
        path: "/sample-analysis",
        icon: FileText,
      },
      {
        title: "Create Sample",
        path: "/sample-analysis/create",
        icon: Plus,
      },
    ],
  },
  {
    title: "Reports",
    path: "/reports",
    icon: FileChartLine,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/reports"],
  },
  {
    title: "Users",
    path: "/users",
    icon: Users,
    section: "management",
    permissions: ROUTE_PERMISSION_RULES["/users"],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
    section: "management",
    children: [
      {
        title: "System Settings",
        path: "/settings",
        icon: Settings,
        permissions: ROUTE_PERMISSION_RULES["/settings"],
      },
      {
        title: "Approval Workflows",
        path: "/settings/approval-workflows",
        icon: Workflow,
        permissions: ROUTE_PERMISSION_RULES["/settings/approval-workflows"],
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const { data: session } = useSession();
  const permissionCodes = session?.user?.permissionCodes ?? [];

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isChildActive = (childPath: string) => {
    return pathname === childPath;
  };

  const canSeeNavItem = (item: NavItem) => {
    if (item.children?.length) {
      return item.children.some((child) => canSeeChild(child, item));
    }
    return sessionHasAnyPermission(permissionCodes, item.permissions);
  };

  const canSeeChild = (child: SubNavItem, parent: NavItem) => {
    const effective =
      child.permissions && child.permissions.length > 0
        ? child.permissions
        : parent.permissions;
    return sessionHasAnyPermission(permissionCodes, effective);
  };

  const filteredNavigationItems = navigationItems.filter(canSeeNavItem);
  const mainItems = filteredNavigationItems.filter((item) => item.section !== "management");
  const managementItems = filteredNavigationItems.filter(
    (item) => item.section === "management",
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200/70 dark:border-slate-800" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="rounded-xl px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground shadow-sm dark:bg-slate-900">
                  <Image
                    src={"/assets/puntland_logo.svg"}
                    alt="logo"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-tight">WTMB</span>
                  <span className="text-[11px] text-slate-500">Mining License System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-1">
        <SidebarGroup className="pt-0">
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wide text-slate-500">
            Main
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1.5">
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.children ? (
                  <>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(item.path)}
                      className="rounded-lg px-2.5 data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:font-semibold hover:bg-slate-100 dark:data-[active=true]:bg-indigo-950/40 dark:data-[active=true]:text-indigo-300 dark:hover:bg-slate-800"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub className="ml-2 space-y-1 border-l border-slate-200/80 dark:border-slate-800">
                      {item.children
                        .filter((child) => canSeeChild(child, item))
                        .map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isChildActive(child.path)}
                            className="rounded-md px-2 data-[active=true]:bg-indigo-600 data-[active=true]:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Link href={child.path}>
                              <child.icon className="size-3.5" />
                              {child.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    className="rounded-lg px-2.5 data-[active=true]:bg-indigo-600 data-[active=true]:font-semibold data-[active=true]:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Link href={item.path}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {managementItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wide text-slate-500">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.path)}
                        className="rounded-lg px-2.5 data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 data-[active=true]:font-semibold hover:bg-slate-100 dark:data-[active=true]:bg-indigo-950/40 dark:data-[active=true]:text-indigo-300 dark:hover:bg-slate-800"
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub className="ml-2 space-y-1 border-l border-slate-200/80 dark:border-slate-800">
                        {item.children
                          .filter((child) => canSeeChild(child, item))
                          .map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isChildActive(child.path)}
                                className="rounded-md px-2 data-[active=true]:bg-indigo-600 data-[active=true]:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <Link href={child.path}>
                                  <child.icon className="size-3.5" />
                                  {child.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      className="rounded-lg px-2.5 data-[active=true]:bg-indigo-600 data-[active=true]:font-semibold data-[active=true]:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Link href={item.path}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
