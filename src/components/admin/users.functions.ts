import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const userRoleSchema = z.enum(["admin", "carga", "consulta"]);

const createUserSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(72),
  role: userRoleSchema,
});

const userRoleUpdateSchema = z.object({
  userId: z.string().uuid(),
  role: userRoleSchema,
});

const temporaryPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(12).max(72),
});
const ownPasswordSchema = z.object({
  password: z.string().min(12).max(72),
});

type UserRole = z.infer<typeof userRoleSchema>;

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error(`No se pudo verificar el rol administrador: ${error.message}`);
  if (!data) throw new Error("No tenés permiso para administrar usuarios.");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles, error: rolesError }, users] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id,role"),
      (async () => {
        const allUsers = [];
        for (let page = 1; ; page += 1) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage: 1000,
          });
          if (error) throw new Error(`No se pudieron cargar las cuentas: ${error.message}`);
          allUsers.push(...data.users);
          if (data.users.length < 1000) break;
        }
        return allUsers;
      })(),
    ]);

    if (rolesError) throw new Error(`No se pudieron cargar los roles: ${rolesError.message}`);
    const roleByUser = new Map(roles.map((entry) => [entry.user_id, entry.role as UserRole]));

    return users.map((user) => ({
      id: user.id,
      email: user.email ?? "(sin email)",
      role: roleByUser.get(user.id) ?? null,
      createdAt: user.created_at,
      mustChangePassword: user.app_metadata?.["must_change_password"] === true,
      isCurrentUser: user.id === context.userId,
    }));
  });

export const createManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createUserSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      app_metadata: { must_change_password: true },
    });

    if (createError) throw new Error(`No se pudo crear el usuario: ${createError.message}`);

    const { error: clearRolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id);
    if (clearRolesError) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      if (rollbackError) {
        throw new Error(
          `No se pudieron asignar los permisos y tampoco se pudo revertir la cuenta: ${clearRolesError.message}; ${rollbackError.message}`,
        );
      }
      throw new Error(
        `No se pudieron preparar los permisos del usuario: ${clearRolesError.message}`,
      );
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: data.role,
    });
    if (roleError) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      if (rollbackError) {
        throw new Error(
          `No se pudo asignar el rol y tampoco se pudo revertir la cuenta: ${roleError.message}; ${rollbackError.message}`,
        );
      }
      throw new Error(`No se pudo asignar el rol: ${roleError.message}`);
    }

    return { id: created.user.id, email: created.user.email ?? data.email, role: data.role };
  });

export const changeManagedUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(userRoleUpdateSchema)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_set_user_role", {
      p_user_id: data.userId,
      p_role: data.role,
    });
    if (error) throw new Error(`No se pudo actualizar el rol: ${error.message}`);
  });

export const deleteManagedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(userRoleUpdateSchema.pick({ userId: true }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) {
      throw new Error("No podés eliminar tu propia cuenta desde esta pantalla.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error: targetError } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (targetError) throw new Error(`No se encontró la cuenta: ${targetError.message}`);

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId);
    if (rolesError)
      throw new Error(`No se pudo verificar el rol de la cuenta: ${rolesError.message}`);

    const previousRole = roles.some((entry) => entry.role === "admin") ? "admin" : roles[0]?.role;
    if (previousRole === "admin") {
      const { error: demoteError } = await context.supabase.rpc("admin_set_user_role", {
        p_user_id: data.userId,
        p_role: "consulta",
      });
      if (demoteError) {
        throw new Error(`No se puede eliminar la cuenta administradora: ${demoteError.message}`);
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (deleteError) {
      if (previousRole === "admin") {
        const { error: restoreError } = await context.supabase.rpc("admin_set_user_role", {
          p_user_id: data.userId,
          p_role: "admin",
        });
        if (restoreError) {
          throw new Error(
            `No se pudo eliminar la cuenta y tampoco restaurar su rol administrador: ${deleteError.message}; ${restoreError.message}`,
          );
        }
      }
      throw new Error(
        `No se pudo eliminar la cuenta de ${target.user.email ?? "usuario"}: ${deleteError.message}`,
      );
    }
  });

export const resetManagedUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(temporaryPasswordSchema)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (getUserError) throw new Error(`No se encontró el usuario: ${getUserError.message}`);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
      app_metadata: {
        ...existing.user.app_metadata,
        must_change_password: true,
      },
    });
    if (error) throw new Error(`No se pudo establecer la contraseña temporal: ${error.message}`);
  });

export const completeOwnPasswordSetup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(ownPasswordSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    if (getUserError) throw new Error(`No se pudo verificar la cuenta: ${getUserError.message}`);
    if (userData.user.app_metadata?.["must_change_password"] !== true) {
      throw new Error("La cuenta no tiene un cambio de contraseña pendiente.");
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.password,
      app_metadata: {
        ...userData.user.app_metadata,
        must_change_password: false,
      },
    });
    if (error) throw new Error(`No se pudo completar el cambio de contraseña: ${error.message}`);
  });
