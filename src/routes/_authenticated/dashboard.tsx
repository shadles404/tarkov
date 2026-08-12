import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ops/primitives";
import { currency, compact, useRows } from "@/lib/ops";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Marketing Operations" },
      { name: "description", content: "Live overview of influencer, billboard, LCD and payment activity." },
      { property: "og:title", content: "Dashboard — Marketing Operations" },
      { property: "og:description", content: "Live overview of marketing operations across every channel." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: influencers = [] } = useRows("influencers");
  const { data: billboards = [] } = useRows("billboards");
  const { data: screens = [] } = useRows("lcd_screens");
  const { data: payments = [] } = useRows("payments");
  const { data: budgets = [] } = useRows("budgets");
  const { data: expenses = [] } = useRows("expenses");

  const sum = (rows: Array<Record<string, unknown>>, key: string) =>
    rows.reduce((s, r) => s + Number(r[key] ?? 0), 0);
  const pending = payments.filter((p) => p["status"] === "pending");
  const allocated = sum(budgets, "allocated");
  const spent = sum(expenses, "amount");
  const usage = allocated ? Math.round((spent / allocated) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Everything running across your marketing channels right now." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active influencers" value={String(influencers.filter((i) => i["status"] === "active").length)} hint={`${influencers.length} total partners`} />
        <StatCard label="Billboards live" value={String(billboards.filter((b) => b["status"] === "active").length)} hint={`${billboards.length} sites tracked`} />
        <StatCard label="LCD screens live" value={String(screens.filter((s) => s["status"] === "active").length)} hint={`${screens.length} screens tracked`} />
        <StatCard label="Pending payments" value={currency(sum(pending, "amount"))} hint={`${pending.length} awaiting approval`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Budget usage</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {currency(spent)} spent of {currency(allocated)} allocated
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, usage)}%` }} />
          </div>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">{usage}% utilised</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Combined reach</h2>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {compact(sum(influencers, "followers"))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Followers across all active creator partners</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Upcoming payments</h2>
        </div>
        <ul className="divide-y divide-border">
          {payments
            .filter((p) => p["status"] !== "paid")
            .slice(0, 6)
            .map((p) => (
              <li key={String(p["id"])} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="font-medium text-foreground">{String(p["payee"])}</span>
                <span className="tabular-nums text-muted-foreground">{currency(p["amount"], p["currency"])}</span>
              </li>
            ))}
          {payments.filter((p) => p["status"] !== "paid").length === 0 && (
            <li className="px-6 py-6 text-sm text-muted-foreground">Nothing outstanding.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
