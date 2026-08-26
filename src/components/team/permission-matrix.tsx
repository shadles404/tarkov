import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MODULES, ALL_ACTIONS, permKey, type PermAction } from "@/lib/permissions";

export function PermissionMatrix({
  value,
  onChange,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const toggle = (key: string, on: boolean) => {
    const next = new Set(value);
    if (on) next.add(key);
    else next.delete(key);
    onChange(next);
  };

  const setModule = (moduleKey: string, actions: PermAction[], on: boolean) => {
    const next = new Set(value);
    for (const a of actions) {
      const k = permKey(moduleKey, a);
      if (on) next.add(k);
      else next.delete(k);
    }
    onChange(next);
  };

  const setAll = (on: boolean) => {
    if (!on) return onChange(new Set());
    const next = new Set<string>();
    for (const m of MODULES) for (const a of m.actions) next.add(permKey(m.key, a));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Module permissions</p>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setAll(true)}>
            Select all
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setAll(false)}>
            Clear all
          </Button>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Module
              </th>
              {ALL_ACTIONS.map((a) => (
                <th
                  key={a}
                  className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {a}
                </th>
              ))}
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bulk
              </th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((m) => (
              <tr key={m.key} className="border-b border-border/70 last:border-0">
                <td className="px-3 py-2 font-medium">{m.label}</td>
                {ALL_ACTIONS.map((a) => {
                  const supported = m.actions.includes(a);
                  const k = permKey(m.key, a);
                  return (
                    <td key={a} className="px-3 py-2 text-center">
                      {supported ? (
                        <Checkbox
                          checked={value.has(k)}
                          onCheckedChange={(v) => toggle(k, Boolean(v))}
                          aria-label={`${m.label} ${a}`}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setModule(m.key, m.actions, true)}
                    >
                      All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setModule(m.key, m.actions, false)}
                    >
                      None
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
