import { createFileRoute, redirect } from "@tanstack/react-router";
import { CatalogosAdmin } from "@/components/admin/CatalogosAdmin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
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
      { title: "Administración — Gestión de Personal" },
      { name: "description", content: "Administración de estructura organizativa y catálogos." },
    ],
  }),
  component: CatalogosAdmin,
});
