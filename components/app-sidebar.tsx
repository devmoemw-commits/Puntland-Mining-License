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
  Map,
  PackageCheck,
  Plus,
  ScrollText,
  Settings,
  Tags,
  TestTube2,
  User,
  Users,
  Workflow,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { handleSignOut } from "@/lib/actions/auth.action";
import {
  ROUTE_PERMISSION_RULES,
  type Permission,
  sessionHasAnyPermission,
} from "@/lib/permissions";

type SectionKey = "main" | "insights" | "administration";

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
  section: SectionKey;
  children?: SubNavItem[];
  /** If omitted, any signed-in user can see the item. */
  permissions?: readonly Permission[];
};

const SECTION_LABELS: Record<SectionKey, string> = {
  main: "Menu",
  insights: "Insights",
  administration: "Administration",
};

const SECTION_ORDER: SectionKey[] = ["main", "insights", "administration"];

// Aligned with `ROUTE_PERMISSION_RULES` in lib/permissions.ts
const navigationItems: NavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, section: "main" },
  {
    title: "Licenses",
    path: "/licenses",
    icon: FileBadge,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/licenses"],
    children: [
      { title: "Licenses List", path: "/licenses", icon: FileText },
      { title: "Create License", path: "/licenses/create", icon: Plus },
    ],
  },
  {
    title: "Sample Analysis",
    path: "/sample-analysis",
    icon: TestTube2,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/sample-analysis"],
    children: [
      { title: "Sample List", path: "/sample-analysis", icon: FileText },
      { title: "Create Sample", path: "/sample-analysis/create", icon: Plus },
    ],
  },
  {
    title: "Mineral Exports",
    path: "/exports",
    icon: PackageCheck,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/exports"],
    children: [
      { title: "Exports List", path: "/exports", icon: FileText },
      { title: "New Export", path: "/exports/create", icon: Plus },
    ],
  },
  {
    title: "GIS Map",
    path: "/map",
    icon: Map,
    section: "main",
    permissions: ROUTE_PERMISSION_RULES["/map"],
  },
  {
    title: "Reports",
    path: "/reports",
    icon: FileChartLine,
    section: "insights",
    permissions: ROUTE_PERMISSION_RULES["/reports"],
  },
  {
    title: "Activity Logs",
    path: "/activity-logs",
    icon: ScrollText,
    section: "insights",
    permissions: ROUTE_PERMISSION_RULES["/activity-logs"],
  },
  {
    title: "Users",
    path: "/users",
    icon: Users,
    section: "administration",
    permissions: ROUTE_PERMISSION_RULES["/users"],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
    section: "administration",
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

/** True when `pathname` is `target` or a descendant of it. "/" only matches exactly. */
function isWithin(pathname: string, target: string): boolean {
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const permissionCodes = session?.user?.permissionCodes ?? [];

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

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

  /** Whether this item (leaf or section) is on the current path. */
  const isItemActive = (item: NavItem) => isWithin(pathname, item.path);

  /** The single best-matching (longest) visible child path, or null. */
  const activeChildPath = (item: NavItem): string | null => {
    const matches = (item.children ?? [])
      .filter((c) => canSeeChild(c, item))
      .filter((c) => isWithin(pathname, c.path));
    if (matches.length === 0) return null;
    return matches.reduce((best, c) =>
      c.path.length > best.path.length ? c : best,
    ).path;
  };

  const visibleItems = navigationItems.filter(canSeeNavItem);

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
    // Section with children (collapsible)
    if (item.children?.length) {
      const visibleChildren = item.children.filter((child) =>
        canSeeChild(child, item),
      );
      const sectionActive = isItemActive(item);
      const activeChild = activeChildPath(item);

      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={sectionActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={sectionActive}
                className="rounded-lg font-medium transition-colors data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-sidebar-accent"
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
                <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className="mx-0 ml-4 border-l border-sidebar-border/70 px-1.5">
                {visibleChildren.map((child) => (
                  <SidebarMenuSubItem key={child.title}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={activeChild === child.path}
                      className="rounded-md data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-primary-foreground"
                    >
                      <Link href={child.path} onClick={closeOnMobile}>
                        <child.icon className="size-3.5 shrink-0" />
                        <span className="truncate">{child.title}</span>
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

    // Leaf item
    const active = isItemActive(item);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          isActive={active}
          className="group/leaf relative rounded-lg font-medium transition-colors data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm hover:bg-sidebar-accent"
        >
          <Link href={item.path} onClick={closeOnMobile}>
            {/* Active accent bar */}
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80 opacity-0 transition-opacity group-data-[active=true]/leaf:opacity-100 group-data-[collapsible=icon]:hidden" />
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border" {...props}>
      {/* Brand */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="rounded-xl hover:bg-sidebar-accent"
            >
              <Link href="/" onClick={closeOnMobile}>
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 shadow-sm ring-1 ring-indigo-200/60 dark:ring-indigo-900/60">
                  <Image
                    src="/assets/puntland_logo.svg"
                    alt="logo"
                    width={80}
                    height={80}
                    className="size-6 object-contain"
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

      {/* Navigation */}
      <SidebarContent className="px-1.5">
        {SECTION_ORDER.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={section}>
              <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                {SECTION_LABELS[section]}
              </SidebarGroupLabel>
              <SidebarMenu className="gap-1">
                {items.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* User */}
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
                    <AvatarFallback className="rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="truncate text-sm font-medium">{userName}</span>
                    <span className="truncate text-[11px] capitalize text-muted-foreground">
                      {userRole.replaceAll("_", " ").toLowerCase()}
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
                  className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
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
