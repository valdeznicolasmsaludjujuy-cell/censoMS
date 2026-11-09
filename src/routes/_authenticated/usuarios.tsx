import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserManagement } from "@/components/admin/UserManagement";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/usuarios")({
  beforeLoad: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw redirect({ to: "/auth" });

    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (error) throw error;
    if (!isAdmin) throw redirect({ to: "/planilla" });
  },
  head: () => ({
    meta: [
      { title: "Gestión de usuarios — Gestión de Personal" },
      { name: "description", content: "Cuentas, roles y contraseñas de acceso." },
    ],
  }),
  component: UserManagement,
});
