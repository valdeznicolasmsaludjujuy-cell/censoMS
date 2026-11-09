import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ClipboardCheck, ClipboardList, LogOut, Settings2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    if (data.user.app_metadata?.["must_change_password"]) {
      throw redirect({ to: "/change-password" });
    }
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const adminRole = useQuery({
    queryKey: ["admin-role", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (adminRole.error)
      toast.error(`No se pudo verificar el permiso de administración: ${adminRole.error.message}`);
  }, [adminRole.error]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls =
    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:gap-3";

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <div className="border-b border-sidebar-border px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="leading-tight">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/55">
              Ministerio de Salud
            </p>
            <p className="mt-1.5 text-sm font-semibold tracking-tight">Gestión de Personal</p>
          </div>
        </div>
        <nav
          aria-label="Navegación principal"
          className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col"
        >
          <Link
            to="/planilla"
            className={linkCls + " flex-1 justify-center lg:flex-none lg:justify-start"}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
            }}
          >
            <ClipboardList className="h-4 w-4" strokeWidth={1.6} /> Planilla a completar
          </Link>
          <Link
            to="/controlados"
            className={linkCls + " flex-1 justify-center lg:flex-none lg:justify-start"}
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground",
            }}
          >
            <ClipboardCheck className="h-4 w-4" strokeWidth={1.6} /> Datos controlados
          </Link>
          {adminRole.data && (
            <>
              <Link
                to="/admin"
                className={linkCls + " flex-1 justify-center lg:flex-none lg:justify-start"}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <Settings2 className="h-4 w-4" strokeWidth={1.6} /> Datos maestros
              </Link>
              <Link
                to="/usuarios"
                className={linkCls + " flex-1 justify-center lg:flex-none lg:justify-start"}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground",
                }}
              >
                <UsersRound className="h-4 w-4" strokeWidth={1.6} /> Usuarios
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center justify-between gap-3 border-t border-sidebar-border px-4 py-3 sm:px-6 lg:block lg:p-4">
          <p className="min-w-0 truncate text-xs text-sidebar-foreground/55 lg:px-3 lg:pb-2">
            {user.email}
          </p>
          <button onClick={signOut} className={linkCls + " shrink-0 lg:w-full"}>
            <LogOut className="h-4 w-4" strokeWidth={1.6} />{" "}
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
