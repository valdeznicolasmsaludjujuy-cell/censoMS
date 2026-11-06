import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, ClipboardCheck, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">Ministerio de Salud</p>
            <p className="text-sm font-bold">Gestión de Personal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link to="/planilla" className={linkCls} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <ClipboardList className="h-4 w-4" /> Planilla a completar
          </Link>
          <Link to="/controlados" className={linkCls} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <ClipboardCheck className="h-4 w-4" /> Datos controlados
          </Link>
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-3 pb-2 text-xs text-sidebar-foreground/60">{user.email}</p>
          <button onClick={signOut} className={linkCls + " w-full"}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
