import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_admin");
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const createTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      email: string;
      password: string;
      full_name: string;
      username?: string | null;
      phone?: string | null;
      avatar_url?: string | null;
      status?: string;
      role?: "admin" | "user";
      permissions?: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, username: data.username, phone: data.phone },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create the user");

    const uid = created.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.email,
      full_name: data.full_name,
      username: data.username ?? null,
      phone: data.phone ?? null,
      avatar_url: data.avatar_url ?? null,
      status: data.status ?? "active",
    } as any);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role ?? "user" } as any);

    const rows = (data.permissions ?? []).map((k) => {
      const [module, action] = k.split(":");
      return { user_id: uid, module, action };
    });
    if (rows.length) await supabaseAdmin.from("user_permissions").insert(rows as any);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "create",
      module: "users",
      record_id: uid,
      record_label: data.full_name,
      new_value: { email: data.email, role: data.role ?? "user" },
    } as any);

    return { id: uid };
  });

export const resetTeamUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "reset_password",
      module: "users",
      record_id: data.userId,
    } as any);
    return { ok: true };
  });

export const deleteTeamUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own admin account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_logs").insert({
      user_id: context.userId,
      action: "delete",
      module: "users",
      record_id: data.userId,
    } as any);
    return { ok: true };
  });
