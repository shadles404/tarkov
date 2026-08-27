import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ops/primitives";
import { Input } from "@/components/ui/input";
import { useAccess } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/settings/activity")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Activity Log — Marketing Operations" },
      { name: "description", content: "Audit trail of every create, update and delete across the marketing operations system." },
      { property: "og:title", content: "Activity Log — Marketing Operations" },
      { property: "og:description", content: "Audit trail of every create, update and delete across the marketing operations system." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Log = {
  id: string;
  user_email: string | null;
  action: string;
  module: string;
  record_label: string | null;
  created_at: string;
};

function Page() {
  const access = useAccess();
  const [q, setQ] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<Log[]> => {
      const { data, error } = await supabase
        .from("audit_logs" as any)
        .select("id, user_email, action, module, record_label, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Log[];
    },
  });

  if (access.loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!access.isAdmin)
    return (
      <div className="surface-card p-8 text-center">
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only the primary admin can view the activity log.</p>
      </div>
    );

  const term = q.trim().toLowerCase();
  const rows = term
    ? logs.filter((l) =>
        [l.user_email, l.action, l.module, l.record_label].some((v) => (v ?? "").toLowerCase().includes(term)),
      )
    : logs;

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="Every create, update and delete performed by your team." />
      <Input placeholder="Search activity…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Record</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                rows.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{l.user_email ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{l.action}</td>
                    <td className="px-4 py-3 capitalize">{l.module.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{l.record_label ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
