import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, KeyRound, Trash2, Pencil, ShieldCheck, History } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { PageHeader, StatusBadge } from "@/components/ops/primitives";
import { PermissionMatrix } from "@/components/team/permission-matrix";
import { useAccess, permKey } from "@/lib/permissions";
import { createTeamUser, deleteTeamUser, resetTeamUserPassword } from "@/lib/team.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export const Route = createFileRoute("/_authenticated/settings/users")({
  head: () => ({
    meta: [
      { title: "Team & Permissions — Marketing Operations" },
      { name: "description", content: "Create sub-users and control module-by-module permissions." },
      { property: "og:title", content: "Team & Permissions — Marketing Operations" },
      { property: "og:description", content: "Create sub-users and control module-by-module permissions." },
    ],
  }),
  component: Page,
});

type TeamUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  role: string;
  permissions: string[];
};

function useTeam() {
  return useQuery({
    queryKey: ["team-users"],
    queryFn: async (): Promise<TeamUser[]> => {
      const [{ data: profiles, error }, { data: roles }, { data: perms }] = await Promise.all([
        supabase.from("profiles" as any).select("*").order("created_at", { ascending: true }),
        supabase.from("user_roles" as any).select("user_id, role"),
        supabase.from("user_permissions" as any).select("user_id, module, action"),
      ]);
      if (error) throw error;
      return (profiles ?? []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        username: p.username,
        email: p.email,
        phone: p.phone,
        avatar_url: p.avatar_url,
        status: p.status ?? "active",
        role: ((roles ?? []) as any[]).find((r: any) => r.user_id === p.id)?.role ?? "user",
        permissions: ((perms ?? []) as any[])
          .filter((x: any) => x.user_id === p.id)
          .map((x: any) => permKey(x.module, x.action)),
      }));
    },
  });
}

function Page() {
  const access = useAccess();
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useTeam();

  const [editing, setEditing] = useState<TeamUser | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<TeamUser | null>(null);
  const [resetting, setResetting] = useState<TeamUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const createFn = useServerFn(createTeamUser);
  const resetFn = useServerFn(resetTeamUserPassword);
  const deleteFn = useServerFn(deleteTeamUser);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["team-users"] });
    qc.invalidateQueries({ queryKey: ["my-access"] });
  };

  const toggleStatus = useMutation({
    mutationFn: async (u: TeamUser) => {
      const status = u.status === "active" ? "inactive" : "active";
      const { error } = await supabase.from("profiles" as any).update({ status }).eq("id", u.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User status updated");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeUser = useMutation({
    mutationFn: async (u: TeamUser) => deleteFn({ data: { userId: u.id } }),
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetPassword = useMutation({
    mutationFn: async (payload: { userId: string; password: string }) => resetFn({ data: payload }),
    onSuccess: () => {
      toast.success("Password reset");
      setResetting(null);
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (access.loading) return <p className="text-muted-foreground">Loading…</p>;

  if (!access.isAdmin) {
    return (
      <div className="surface-card p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h1 className="font-display text-lg font-semibold">Admin only</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only the primary admin can manage team members and permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team & Permissions"
        description="Create sub-users and control every module and action they can reach."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/settings/activity">
                <History className="size-4" /> Activity log
              </Link>
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> Add user
            </Button>
          </div>
        }
      />

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {["User", "Username", "Phone", "Role", "Permissions", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.full_name ?? "User"}
                          className="size-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                          {(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{u.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{u.username ?? "—"}</td>
                  <td className="px-4 py-3">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={u.role === "admin" ? "admin" : "sub-user"} />
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? "Full access" : `${u.permissions.length} granted`}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.status === "active"}
                        disabled={u.role === "admin"}
                        onCheckedChange={() => toggleStatus.mutate(u)}
                      />
                      <span className="text-xs text-muted-foreground">{u.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit"
                        onClick={() => {
                          setEditing(u);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Reset password"
                        onClick={() => setResetting(u)}
                      >
                        <KeyRound className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        disabled={u.role === "admin"}
                        onClick={() => setPendingDelete(u)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        user={editing}
        onCreated={invalidate}
        createFn={createFn}
      />

      <Dialog open={Boolean(resetting)} onOpenChange={(v) => !v && setResetting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetting(null)}>
              Cancel
            </Button>
            <Button
              disabled={newPassword.length < 6 || resetPassword.isPending}
              onClick={() =>
                resetting && resetPassword.mutate({ userId: resetting.id, password: newPassword })
              }
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              Their account, role and permissions are permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removeUser.mutate(pendingDelete);
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

function UserDialog({
  open,
  onOpenChange,
  user,
  onCreated,
  createFn,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: TeamUser | null;
  onCreated: () => void;
  createFn: (args: { data: any }) => Promise<any>;
}) {
  const initialPerms = useMemo(() => new Set(user?.permissions ?? []), [user]);
  const [perms, setPerms] = useState<Set<string>>(initialPerms);
  const [form, setForm] = useState<Record<string, string>>({});
  const [permsTouched, setPermsTouched] = useState(false);

  const value = (key: keyof TeamUser) =>
    form[key as string] ?? (user ? String((user[key] ?? "") as string) : "");

  const currentPerms = permsTouched ? perms : initialPerms;

  const save = useMutation({
    mutationFn: async () => {
      if (user) {
        const { error } = await supabase
          .from("profiles" as any)
          .update({
            full_name: value("full_name") || null,
            username: value("username") || null,
            phone: value("phone") || null,
            avatar_url: value("avatar_url") || null,
          })
          .eq("id", user.id);
        if (error) throw error;

        if (user.role !== "admin") {
          const { error: delErr } = await supabase
            .from("user_permissions" as any)
            .delete()
            .eq("user_id", user.id);
          if (delErr) throw delErr;
          const rows = [...currentPerms].map((k) => {
            const [module, action] = k.split(":");
            return { user_id: user.id, module, action };
          });
          if (rows.length) {
            const { error: insErr } = await supabase.from("user_permissions" as any).insert(rows);
            if (insErr) throw insErr;
          }
        }
        return;
      }

      await createFn({
        data: {
          email: value("email"),
          password: form["password"] ?? "",
          full_name: value("full_name"),
          username: value("username") || null,
          phone: value("phone") || null,
          avatar_url: value("avatar_url") || null,
          status: "active",
          role: "user",
          permissions: [...currentPerms],
        },
      });
    },
    onSuccess: () => {
      toast.success(user ? "User updated" : "User created");
      onCreated();
      onOpenChange(false);
      setForm({});
      setPermsTouched(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setForm({});
          setPermsTouched(false);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{user ? `Edit ${user.full_name ?? "user"}` : "Add user"}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required value={value("full_name")} onChange={(v) => setForm((p) => ({ ...p, full_name: v }))} />
            <Field label="Username" value={value("username")} onChange={(v) => setForm((p) => ({ ...p, username: v }))} />
            <Field
              label="Email"
              type="email"
              required
              disabled={Boolean(user)}
              value={value("email")}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            />
            <Field label="Phone" value={value("phone")} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
            {user ? null : (
              <Field
                label="Password"
                type="password"
                required
                value={form["password"] ?? ""}
                onChange={(v) => setForm((p) => ({ ...p, password: v }))}
              />
            )}
            <Field
              label="Profile photo URL"
              value={value("avatar_url")}
              onChange={(v) => setForm((p) => ({ ...p, avatar_url: v }))}
            />
          </div>

          {user?.role === "admin" ? (
            <p className="rounded-md bg-secondary p-3 text-sm text-muted-foreground">
              This is the primary admin account — it always keeps full access.
            </p>
          ) : (
            <PermissionMatrix
              value={currentPerms}
              onChange={(next) => {
                setPerms(next);
                setPermsTouched(true);
              }}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : user ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input
        id={label}
        type={type}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
