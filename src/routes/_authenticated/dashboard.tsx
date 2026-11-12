import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
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
      { title: "Dashboard — Gestión de Personal" },
      { name: "description", content: "Estadísticas globales y por estructura organizativa." },
    ],
  }),
  component: AdminDashboard,
});
