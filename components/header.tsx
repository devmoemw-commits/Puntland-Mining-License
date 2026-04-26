"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Bell,
  LogOut,
  User,
  Clock,
  AlertTriangle,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handleSignOut } from "@/lib/actions/auth.action";
import config from "@/lib/config/config";
import type { Session } from "next-auth";
import ClockHeader from "./clock";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface License {
  id: string;
  license_ref_id: string;
  company_name: string;
  expire_date: string;
  license_type: string;
}

interface ExpiringNotification {
  id: string;
  company_name: string;
  license_ref_id: string;
  license_type: string;
  expire_date: string;
  days_left: number;
}

export function DashboardHeader({ session }: { session: Session }) {
  const pathname = usePathname();
  const [expiringLicenses, setExpiringLicenses] = useState<
    ExpiringNotification[]
  >([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { theme, setTheme } = useTheme();

  // Handle sign out with proper async handling
  const onSignOut = async () => {
    try {
      await handleSignOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  // Fetch and check for expiring licenses
  useEffect(() => {
    const fetchExpiringLicenses = async () => {
      try {
        const response = await fetch(`${config.env.apiEndpoint}/api/licenses`);
        if (!response.ok) return;

        const licenses: License[] = await response.json();
        const now = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(now.getMonth() + 1);

        const expiring = licenses
          .map((license) => {
            const expireDate = new Date(license.expire_date);
            const timeDiff = expireDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

            return {
              id: license.id,
              company_name: license.company_name,
              license_ref_id: license.license_ref_id,
              license_type: license.license_type,
              expire_date: license.expire_date,
              days_left: daysLeft,
            };
          })
          .filter((license) => {
            // Show licenses expiring within 30 days (including expired ones)
            return license.days_left <= 30 && license.days_left >= -7; // Show up to 7 days after expiry
          })
          .sort((a, b) => a.days_left - b.days_left); // Sort by urgency

        setExpiringLicenses(expiring);
        setNotificationCount(expiring.length);
      } catch (error) {
        console.error("Failed to fetch expiring licenses:", error);
      }
    };

    fetchExpiringLicenses();
    // Refresh every hour
    const interval = setInterval(fetchExpiringLicenses, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Generate breadcrumbs based on the current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter(Boolean);

    // If no segments, we're on the home page
    if (segments.length === 0) {
      return [{ label: "Dashboard", href: "/" }];
    }

    // Build breadcrumb items from path segments
    return segments.reduce<BreadcrumbItem[]>(
      (acc, segment, index) => {
        // Create a path up to the current segment
        const href = `/${segments.slice(0, index + 1).join("/")}`;

        // Format the segment for display (capitalize first letter, replace hyphens with spaces)
        const label = segment
          .replace(/-/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase());

        return [...acc, { label, href }];
      },
      [{ label: "Dashboard", href: "/" }]
    );
  };

  const breadcrumbs = generateBreadcrumbs();

  const formatNotificationDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft < 0) return "text-red-600"; // Expired
    if (daysLeft <= 7) return "text-red-500"; // Critical
    if (daysLeft <= 14) return "text-orange-500"; // Warning
    return "text-yellow-600"; // Notice
  };

  const getUrgencyBadge = (daysLeft: number) => {
    if (daysLeft < 0)
      return { text: "EXPIRED", variant: "destructive" as const };
    if (daysLeft <= 7)
      return { text: "CRITICAL", variant: "destructive" as const };
    if (daysLeft <= 14)
      return { text: "WARNING", variant: "secondary" as const };
    return { text: "NOTICE", variant: "outline" as const };
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        {/* Left Section - Navigation */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="h-6" />
        </div>

        {/* Center Section - Breadcrumbs */}
        <nav className="md:flex items-center hidden gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              <Link
                href={breadcrumb.href}
                className={cn(
                  "hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50",
                  index === breadcrumbs.length - 1 &&
                    "text-foreground font-medium bg-muted/30"
                )}
              >
                {breadcrumb.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* Right Section - Actions & User */}
        <div className="ml-auto flex items-center gap-3">
         <ClockHeader />
          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="h-4 w-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications with Expiring Licenses */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 relative"
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 hover:bg-red-500">
                      {notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold">
                    License Expiry Notifications
                  </h4>
                  <Badge variant="secondary">{notificationCount}</Badge>
                </div>
                <ScrollArea className="h-80">
                  {expiringLicenses.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No expiring licenses</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {expiringLicenses.map((license) => {
                        const urgencyBadge = getUrgencyBadge(license.days_left);
                        return (
                          <div
                            key={license.id}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {license.days_left < 0 ? (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Clock
                                  className={cn(
                                    "h-4 w-4",
                                    getUrgencyColor(license.days_left)
                                  )}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium truncate">
                                  {license.company_name}
                                </p>
                                <Badge
                                  variant={urgencyBadge.variant}
                                  className="text-xs"
                                >
                                  {urgencyBadge.text}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">
                                {license.license_type} •{" "}
                                {license.license_ref_id}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {license.days_left < 0
                                  ? `Expired ${Math.abs(license.days_left)} days ago`
                                  : license.days_left === 0
                                    ? "Expires today"
                                    : `Expires in ${license.days_left} days`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due:{" "}
                                {formatNotificationDate(license.expire_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                {expiringLicenses.length > 0 && (
                  <div className="p-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Link href="/licenses">View All Licenses</Link>
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {session?.user?.name
                      ?.split(" ")
                      .slice(0, 2)
                      .map((n: string) => n.charAt(0))
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">
                    {session?.user?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    WTMB {session?.user?.role}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name ?? "Abdulqadir"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email ?? "admin@mining.so"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/user/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
