
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Session } from "next-auth";
import dynamic from "next/dynamic";

const DashboardHeader = dynamic(
  () => import("./header").then((mod) => mod.DashboardHeader),
  { ssr: false },
);



const LayoutClient = ({ children, session }: { children: React.ReactNode, session: Session }) => {
  return (
    
    <SidebarProvider>
      <AppSidebar/>
      <SidebarInset>
        <DashboardHeader session={session} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LayoutClient;
