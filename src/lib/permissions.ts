import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PermAction = "view" | "add" | "update" | "delete" | "approve" | "export";

export type ModuleDef = {
  key: string;
  label: string;
  actions: PermAction[];
  routes: string[];
};

const BASE: PermAction[] = ["view", "add", "update", "delete", "export"];
const WITH_APPROVE: PermAction[] = ["view", "add", "update", "delete", "approve", "export"];

export const MODULES: ModuleDef[] = [
  { key: "dashboard", label: "Dashboard", actions: ["view"], routes: ["/dashboard"] },
  { key: "influencers", label: "Influencers", actions: BASE, routes: ["/influencers"] },
  { key: "targets", label: "Target Tracking", actions: BASE, routes: ["/influencers/targets"] },
  { key: "deliveries", label: "Delivery Records", actions: BASE, routes: ["/influencers/deliveries"] },
  {
    key: "influencer_payments",
    label: "Influencer Payments",
    actions: WITH_APPROVE,
    routes: ["/influencers/payments"],
  },
  { key: "billboards", label: "Billboards", actions: BASE, routes: ["/billboards", "/billboards/tracking"] },
  {
    key: "billboard_payments",
    label: "Billboard Payments",
    actions: WITH_APPROVE,
    routes: ["/billboards/payments"],
  },
  { key: "lcd_screens", label: "LCD Screens", actions: BASE, routes: ["/lcd"] },
  { key: "lcd_videos", label: "LCD Videos", actions: BASE, routes: ["/lcd/videos"] },
  { key: "lcd_payments", label: "LCD Payments", actions: WITH_APPROVE, routes: ["/lcd/payments"] },
  { key: "budget", label: "Budget", actions: BASE, routes: ["/budget/local", "/budget/international"] },
  { key: "expenses", label: "Expenses", actions: WITH_APPROVE, routes: ["/budget/expenses"] },
  {
    key: "reports",
    label: "Reports",
    actions: ["view", "export"],
    routes: [
      "/reports/influencers",
      "/reports/billboards",
      "/reports/lcd",
      "/reports/budget",
      "/reports/payments",
      "/reports/monthly",
    ],
  },
];

export const ALL_ACTIONS: PermAction[] = ["view", "add", "update", "delete", "approve", "export"];

export const moduleByKey = (key: string) => MODULES.find((m) => m.key === key);

export const permKey = (module: string, action: string) => `${module}:${action}`;

export type Access = {
  isAdmin: boolean;
  keys: Set<string>;
  loading: boolean;
  can: (module: string, action: PermAction) => boolean;
  canSeeRoute: (path: string) => boolean;
};

export function useAccess(): Access {
  const { data, isLoading } = useQuery({
    queryKey: ["my-access"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return { isAdmin: false, keys: [] as string[] };

      const [{ data: roles }, { data: perms }] = await Promise.all([
        supabase.from("user_roles" as any).select("role").eq("user_id", uid),
        supabase.from("user_permissions" as any).select("module, action").eq("user_id", uid),
      ]);

      const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
      const keys = (perms ?? []).map((p: any) => permKey(p.module, p.action));
      return { isAdmin, keys };
    },
    staleTime: 60_000,
  });

  const isAdmin = data?.isAdmin ?? false;
  const keys = new Set(data?.keys ?? []);

  const can = (module: string, action: PermAction) => isAdmin || keys.has(permKey(module, action));

  const canSeeRoute = (path: string) => {
    if (isAdmin) return true;
    const mod = MODULES.find((m) => m.routes.includes(path));
    if (!mod) return false;
    return keys.has(permKey(mod.key, "view"));
  };

  return { isAdmin, keys, loading: isLoading, can, canSeeRoute };
}
