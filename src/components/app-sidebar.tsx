import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Target,
  PackageCheck,
  Wallet,
  Signpost,
  CalendarClock,
  MonitorPlay,
  Film,
  PiggyBank,
  Globe2,
  Receipt,
  Clock3,
  BadgeCheck,
  CircleDollarSign,
  History,
  FileBarChart,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Influencers",
    items: [
      { title: "Influencers", url: "/influencers", icon: Users },
      { title: "Target Tracking", url: "/influencers/targets", icon: Target },
      { title: "Delivery Records", url: "/influencers/deliveries", icon: PackageCheck },
      { title: "Influencer Payments", url: "/influencers/payments", icon: Wallet },
    ],
  },
  {
    label: "Billboards",
    items: [
      { title: "Billboard Database", url: "/billboards", icon: Signpost },
      { title: "Active / Expired", url: "/billboards/tracking", icon: CalendarClock },
      { title: "Billboard Payments", url: "/billboards/payments", icon: Wallet },
    ],
  },
  {
    label: "LCD Screens",
    items: [
      { title: "LCD Database", url: "/lcd", icon: MonitorPlay },
      { title: "Video Tracking", url: "/lcd/videos", icon: Film },
      { title: "LCD Payments", url: "/lcd/payments", icon: Wallet },
    ],
  },
  {
    label: "Budget",
    items: [
      { title: "Local Budget", url: "/budget/local", icon: PiggyBank },
      { title: "International Budget", url: "/budget/international", icon: Globe2 },
      { title: "Expenses", url: "/budget/expenses", icon: Receipt },
    ],
  },
  {
    label: "Payments",
    items: [
      { title: "Pending", url: "/payments/pending", icon: Clock3 },
      { title: "Approved", url: "/payments/approved", icon: BadgeCheck },
      { title: "Paid", url: "/payments/paid", icon: CircleDollarSign },
      { title: "Payment History", url: "/payments/history", icon: History },
    ],
  },
  {
    label: "Reports",
    items: [
      { title: "Influencer Report", url: "/reports/influencers", icon: FileBarChart },
      { title: "Billboard Report", url: "/reports/billboards", icon: FileBarChart },
      { title: "LCD Report", url: "/reports/lcd", icon: FileBarChart },
      { title: "Budget Report", url: "/reports/budget", icon: FileBarChart },
      { title: "Payment Report", url: "/reports/payments", icon: FileBarChart },
      { title: "Monthly Operations", url: "/reports/monthly", icon: FileBarChart },
    ],
  },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">
            MO
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-display text-sm font-semibold leading-tight">
              Marketing Ops
            </p>
            <p className="truncate text-xs text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
