"use client";

import type * as React from "react";
import {
  Building2,
  ChevronRight,
  ChevronsUpDown,
  FileBadge,
  FileLineChartIcon as FileChartLine,
  FileText,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Plus,
  Settings,
  Tags,
  TestTube2,
  User,
  Users,
  Workflow,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { handleSignOut } from "@/lib/actions/auth.action";
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
        title: "License Categories",
        path: "/settings/license-categories",
        icon: Tags,
        permissions: ROUTE_PERMISSION_RULES["/settings"],
      },
      {
        title: "Business Types",
        path: "/settings/business-types",
        icon: Building2,
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

  const isActive = (path: string) => pathname === path;

  const isSectionActive = (item: NavItem) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);

  const canSeeChild = (child: SubNavItem, parent: NavItem) => {
    const effective =
      child.permissions && child.permissions.length > 0
        ? child.permissions
        : parent.permissions;
    return sessionHasAnyPermission(permissionCodes, effective);
  };

  const canSeeNavItem = (item: NavItem) => {
    if (item.children?.length) {
      return item.children.some((child) => canSeeChild(child, item));
    }
    return sessionHasAnyPermission(permissionCodes, item.permissions);
  };

  const filteredNavigationItems = navigationItems.filter(canSeeNavItem);
  const mainItems = filteredNavigationItems.filter(
    (item) => item.section !== "management",
  );
  const managementItems = filteredNavigationItems.filter(
    (item) => item.section === "management",
  );

  const userName = session?.user?.name ?? "User";
  const userRole = session?.user?.role ?? "";
  const userEmail = session?.user?.email ?? "";
  const userInitials =
    userName
      .split(" ")
      .slice(0, 2)
      .map((n: string) => n.charAt(0))
      .join("")
      .toUpperCase() || "U";

  const renderNavItem = (item: NavItem) => {
    if (item.children?.length) {
      const visibleChildren = item.children.filter((child) =>
        canSeeChild(child, item),
      );
      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={isSectionActive(item)}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isSectionActive(item)}
                className="rounded-lg font-medium data-[active=true]:bg-indigo-50 data-[active=true]:text-indigo-700 dark:data-[active=true]:bg-indigo-950/40 dark:data-[active=true]:text-indigo-300"
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mx-0 ml-4 border-l border-sidebar-border px-1.5">
                {visibleChildren.map((child) => (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive(child.path)}
                      className="rounded-md data-[active=true]:bg-indigo-600 data-[active=true]:text-white data-[active=true]:font-medium"
                    >
                      <Link href={child.path}>
                        <child.icon className="size-3.5" />
                        <span>{child.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={isActive(item.path)}
          className="rounded-lg font-medium data-[active=true]:bg-indigo-600 data-[active=true]:text-white"
        >
          <Link href={item.path}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
      {...props}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="rounded-xl hover:bg-sidebar-accent"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
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
                  <span className="text-[11px] text-muted-foreground">
                    Mining License System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Main
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">{mainItems.map(renderNavItem)}</SidebarMenu>
        </SidebarGroup>

        {managementItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Administration
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {managementItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-indigo-600 text-xs font-semibold text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="truncate text-sm font-medium">
                      {userName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {userRole.replaceAll("_", " ")}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/user/profile" className="flex items-center gap-2">
                    <User className="size-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer"
                  onClick={() => handleSignOut()}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
