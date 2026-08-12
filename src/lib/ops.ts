import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Row = Record<string, any>;

type ListOptions = {
  select?: string | undefined;
  order?: { column: string; ascending?: boolean } | undefined;
  filters?: Array<{ column: string; op: "eq" | "in" | "gte" | "lte" | "neq"; value: any }> | undefined;
};

export function useRows(table: string, options: ListOptions = {}) {
  return useQuery({
    queryKey: [table, options],
    queryFn: async () => {
      let query = supabase.from(table as any).select(options.select ?? "*");
      for (const f of options.filters ?? []) {
        query = (query as any)[f.op](f.column, f.value);
      }
      const order = options.order ?? { column: "created_at", ascending: false };
      query = query.order(order.column, { ascending: order.ascending ?? false });
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });
}

export function useSaveRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Row) => {
      const { id, ...rest } = values;
      if (id) {
        const { error } = await supabase.from(table as any).update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(table as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });
}

export function useDeleteRow(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not delete"),
  });
}

export const currency = (value: number | null | undefined, code = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const compact = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value ?? 0),
  );

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const monthLabel = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—";
