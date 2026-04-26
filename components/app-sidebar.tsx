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
  },
  {
    title: "Licenses",
    path: "/licenses",
    icon: FileBadge,
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
    permissions: ROUTE_PERMISSION_RULES["/reports"],
  },
  {
    title: "Users",
    path: "/users",
    icon: Users,
    permissions: ROUTE_PERMISSION_RULES["/users"],
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
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

  // Custom active class for child links with smooth transitions
  const childActiveClass =
    "transition-all duration-300 ease-in-out data-[active=true]:bg-[#3730a3] dark:hover:bg-[#3730a3] data-[active=true]:text-white hover:data-[active=true]:bg-[#3730a3] hover:data-[active=true]:text-white [&[data-active=true]>svg]:text-white [&:hover[data-active=true]>svg]:text-white hover:bg-gray-100 hover:scale-[1.02] data-[active=true]:shadow-md data-[active=true]:border-l-4 data-[active=true]:border-l-white";

  // Custom active class for single items with smooth transitions
  const singleItemActiveClass = `
  transition-all duration-300 ease-in-out
  data-[active=true]:bg-[#3730a3] 
  data-[active=true]:text-white
  hover:data-[active=true]:bg-[#3730a3] 
  hover:data-[active=true]:text-white 
  dark:hover:bg-[#3730a3] 
  [&[data-active=true]>svg]:text-white 
  [&:hover[data-active=true]>svg]:text-white 
  hover:bg-gray-100 
  hover:scale-[1.02] 
  data-[active=true]:shadow-md 
  data-[active=true]:border-l-4 
  data-[active=true]:border-l-white
  `;

  // Icon animation class
  const iconAnimationClass =
    "transition-all duration-200 ease-in-out hover:scale-110";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="transition-all duration-200 hover:scale-105"
            >
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  <Image
                    src={"/assets/puntland_logo.svg"}
                    alt="logo"
                    width={80}
                    height={80}
                    className="transition-transform duration-200 hover:rotate-12"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">WTMB</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {filteredNavigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.children ? (
                  // Parent item with children - subtle hover animation
                  <>
                    <SidebarMenuButton className="transition-all duration-200 ease-in-out hover:scale-[1.01]">
                      <item.icon className={`size-4 ${iconAnimationClass}`} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuSub className="space-y-1">
                      {item.children
                        .filter((child) => canSeeChild(child, item))
                        .map((child) => (
                        <SidebarMenuSubItem key={child.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isChildActive(child.path)}
                            className={childActiveClass}
                          >
                            <Link href={child.path}>
                              <child.icon
                                className={`size-3.5 ${iconAnimationClass}`}
                              />
                              {child.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </>
                ) : (
                  // Single item without children - keep active styling for these
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    className={singleItemActiveClass}
                  >
                    <Link
                      href={item.path}
                      className="transition-all duration-200 ease-in-out hover:scale-[1.01] dark:hover:bg-[#3730a3]"
                    >
                      <item.icon className={`size-4 ${iconAnimationClass}`} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
