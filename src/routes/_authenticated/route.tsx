import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LogOut,
  Settings2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
    "flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:gap-3";
  const activeLinkCls = "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm";

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col bg-sidebar text-sidebar-foreground shadow-xl shadow-black/5 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-r lg:border-sidebar-border">
        <div className="border-b border-sidebar-border px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/55">
                Ministerio de Salud
              </p>
              <p className="mt-1 truncate text-sm font-semibold tracking-tight">
                Gestión de Personal
              </p>
            </div>
          </div>
        </div>
        <nav
          aria-label="Navegación principal"
          className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-x-visible"
        >
          <Link
            to="/planilla"
            className={linkCls + " flex-none justify-start lg:w-full"}
            activeProps={{
              className: `${linkCls} flex-none justify-start ${activeLinkCls} lg:w-full`,
            }}
          >
            <ClipboardList className="h-4 w-4" strokeWidth={1.6} /> Planilla a completar
          </Link>
          <Link
            to="/controlados"
            className={linkCls + " flex-none justify-start lg:w-full"}
            activeProps={{
              className: `${linkCls} flex-none justify-start ${activeLinkCls} lg:w-full`,
            }}
          >
            <ClipboardCheck className="h-4 w-4" strokeWidth={1.6} /> Datos controlados
          </Link>
          {adminRole.data && (
            <>
              <Link
                to="/dashboard"
                className={linkCls + " flex-none justify-start lg:w-full"}
                activeProps={{
                  className: `${linkCls} flex-none justify-start ${activeLinkCls} lg:w-full`,
                }}
              >
                <BarChart3 className="h-4 w-4" strokeWidth={1.6} /> Dashboard
              </Link>
              <Link
                to="/admin"
                className={linkCls + " flex-none justify-start lg:w-full"}
                activeProps={{
                  className: `${linkCls} flex-none justify-start ${activeLinkCls} lg:w-full`,
                }}
              >
                <Settings2 className="h-4 w-4" strokeWidth={1.6} /> Datos maestros
              </Link>
              <Link
                to="/usuarios"
                className={linkCls + " flex-none justify-start lg:w-full"}
                activeProps={{
                  className: `${linkCls} flex-none justify-start ${activeLinkCls} lg:w-full`,
                }}
              >
                <UsersRound className="h-4 w-4" strokeWidth={1.6} /> Usuarios
              </Link>
            </>
          )}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-sidebar-border px-4 py-3 sm:px-6 lg:block lg:p-4">
          <div className="min-w-0 lg:mb-3 lg:px-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/45">
              Sesión activa
            </p>
            <p className="mt-1 truncate text-xs text-sidebar-foreground/75">{user.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 lg:grid lg:grid-cols-[auto_1fr]">
            <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
            <button
              onClick={signOut}
              className={linkCls + " shrink-0 px-3 lg:w-full lg:justify-start"}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.6} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
