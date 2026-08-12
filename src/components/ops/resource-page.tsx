import { useMemo, useState, type ReactNode } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteRow, useRows, useSaveRow, type Row } from "@/lib/ops";
import { PageHeader } from "./primitives";

export type Column = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  align?: "left" | "right";
};

export type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "month" | "textarea" | "select";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  defaultValue?: string | number;
};

export function DataTable({
  columns,
  rows,
  loading,
  onEdit,
  onDelete,
  empty = "No records yet.",
}: {
  columns: Column[];
  rows: Row[];
  loading?: boolean | undefined;
  onEdit?: ((row: Row) => void) | undefined;
  onDelete?: ((row: Row) => void) | undefined;
  empty?: string | undefined;
}) {
  const hasActions = Boolean(onEdit || onDelete);
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.label}
                </th>
              ))}
              {hasActions ? <th className="w-24 px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-muted-foreground">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row['id'] ?? JSON.stringify(row)} className="border-b border-border/70 last:border-0 hover:bg-secondary/40">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 align-middle ${c.align === "right" ? "text-right tabular-nums" : ""}`}
                    >
                      {c.render ? c.render(row) : (row[c.key] ?? "—")}
                    </td>
                  ))}
                  {hasActions ? (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {onEdit ? (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(row)} aria-label="Edit">
                            <Pencil className="size-4" />
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(row)} aria-label="Delete">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecordDialog({
  open,
  onOpenChange,
  fields,
  initial,
  title,
  onSubmit,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fields: Field[];
  initial: Row | null;
  title: string;
  onSubmit: (values: Row) => void;
  saving?: boolean | undefined;
}) {
  const [values, setValues] = useState<Row>({});

  const current = useMemo(() => {
    const base: Row = {};
    for (const f of fields) {
      const raw = initial?.[f.key] ?? f.defaultValue ?? "";
      base[f.key] = raw === null ? "" : raw;
    }
    return { ...base, ...values };
  }, [fields, initial, values]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setValues({});
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const payload: Row = { id: initial?.['id'] };
            for (const f of fields) {
              const v = current[f.key];
              if (f.type === "number") payload[f.key] = v === "" ? 0 : Number(v);
              else payload[f.key] = v === "" ? null : v;
            }
            onSubmit(payload);
          }}
        >
          {fields.map((f) => (
            <div
              key={f.key}
              className={f.type === "textarea" ? "sm:col-span-2 space-y-2" : "space-y-2"}
            >
              <Label htmlFor={f.key}>{f.label}</Label>
              {f.type === "select" ? (
                <Select
                  value={String(current[f.key] ?? "")}
                  onValueChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))}
                >
                  <SelectTrigger id={f.key}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(f.options ?? []).map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea
                  id={f.key}
                  value={String(current[f.key] ?? "")}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              ) : (
                <Input
                  id={f.key}
                  type={f.type === "number" ? "number" : f.type === "date" || f.type === "month" ? "date" : "text"}
                  required={f.required}
                  value={String(current[f.key] ?? "")}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ResourcePage({
  title,
  description,
  table,
  columns,
  fields,
  select,
  order,
  filters,
  searchKeys = [],
  addLabel = "Add record",
  transform,
  headerExtra,
  readOnly,
}: {
  title: string;
  description?: string | undefined;
  table: string;
  columns: Column[];
  fields: Field[];
  select?: string | undefined;
  order?: { column: string; ascending?: boolean } | undefined;
  filters?: Array<{ column: string; op: "eq" | "in" | "gte" | "lte" | "neq"; value: any }> | undefined;
  searchKeys?: string[] | undefined;
  addLabel?: string | undefined;
  transform?: ((rows: Row[]) => Row[]) | undefined;
  headerExtra?: ((rows: Row[]) => ReactNode) | undefined;
  readOnly?: boolean | undefined;
}) {
  const { data = [], isLoading } = useRows(table, { select, order, filters });
  const save = useSaveRow(table);
  const remove = useDeleteRow(table);
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);

  const rows = useMemo(() => {
    const list = transform ? transform(data) : data;
    if (!term.trim() || searchKeys.length === 0) return list;
    const q = term.toLowerCase();
    return list.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
    );
  }, [data, term, transform, searchKeys]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          readOnly ? undefined : (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> {addLabel}
            </Button>
          )
        }
      />

      {headerExtra ? headerExtra(rows) : null}

      {searchKeys.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search…"
            className="pl-9"
          />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        onEdit={
          readOnly
            ? undefined
            : (row) => {
                setEditing(row);
                setOpen(true);
              }
        }
        onDelete={readOnly ? undefined : (row) => setPendingDelete(row)}
      />

      <RecordDialog
        open={open}
        onOpenChange={setOpen}
        fields={fields}
        initial={editing}
        saving={save.isPending}
        title={editing ? `Edit ${title.replace(/s$/, "")}` : addLabel}
        onSubmit={(values) =>
          save.mutate(values, {
            onSuccess: () => {
              setOpen(false);
              setEditing(null);
            },
          })
        }
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the record and any linked history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete?.['id']) remove.mutate(pendingDelete['id']);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
