
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Buildings,
  ChartBar,
  CheckSquare,
  ClipboardText,
  GearSix,
  SignOut,
  UsersThree,
} from "@phosphor-icons/react";
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

  const [isSigningOut, setIsSigningOut] = useState(false);

  const adminRole = useQuery({
    queryKey: ["admin-role", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (adminRole.error) {
      toast.error(
        `No se pudo verificar el permiso de administración: ${adminRole.error.message}`
      );
    }
  }, [adminRole.error]);

  async function signOut() {
    setIsSigningOut(true);

    try {
      await queryClient.cancelQueries();

      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(`No se pudo cerrar la sesión: ${error.message}`);
        return;
      }

      queryClient.clear();
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.";

      toast.error(`No se pudo cerrar la sesión: ${message}`);
    } finally {
      setIsSigningOut(false);
    }
  }

  const initials =
    (user.email ?? "?")
      .split("@")[0]
      ?.split(/[._-]/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase("es-AR") || "??";

  const roleLabel = adminRole.data ? "Administrador" : "Usuario";

  const linkCls =
    "group flex items-center gap-2 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-sidebar-foreground/65 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:w-full lg:gap-3";

  const activeLinkCls =
    "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-white/10";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="w-full shrink-0 text-sidebar-foreground lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:w-[19rem] lg:p-4 lg:pr-0">
        <div className="relative flex h-full flex-col overflow-hidden bg-sidebar lg:rounded-[1.75rem] lg:border lg:border-white/10 lg:shadow-2xl lg:shadow-black/25">
          <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-sidebar-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative border-b border-sidebar-border px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
                <Buildings className="h-5 w-5" />
              </div>

              <div className="min-w-0 leading-tight">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                  Ministerio de Salud
                </p>
                <p className="mt-1 truncate text-sm font-bold tracking-tight">
                  Gestión de Personal
                </p>
              </div>
            </div>
          </div>

          <nav
            aria-label="Navegación principal"
            className="relative flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:p-4"
          >
            <p className="mb-1 hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35 lg:block">
              Workspace
            </p>

            <Link
              to="/planilla"
              className={linkCls + " flex-none justify-start"}
              activeProps={{
                className: `${linkCls} flex-none justify-start ${activeLinkCls}`,
              }}
            >
              <ClipboardText className="h-4 w-4 shrink-0" />
              <span className="truncate">Planilla a completar</span>
            </Link>

            <Link
              to="/controlados"
              className={linkCls + " flex-none justify-start"}
              activeProps={{
                className: `${linkCls} flex-none justify-start ${activeLinkCls}`,
              }}
            >
              <CheckSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">Datos controlados</span>
            </Link>

            {adminRole.data && (
              <>
                <p className="mb-1 mt-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/35 lg:block">
                  Administración
                </p>

                <Link
                  to="/dashboard"
                  className={linkCls + " flex-none justify-start"}
                  activeProps={{
                    className: `${linkCls} flex-none justify-start ${activeLinkCls}`,
                  }}
                >
                  <ChartBar className="h-4 w-4 shrink-0" />
                  <span className="truncate">Dashboard</span>
                </Link>

                <Link
                  to="/admin"
                  className={linkCls + " flex-none justify-start"}
                  activeProps={{
                    className: `${linkCls} flex-none justify-start ${activeLinkCls}`,
                  }}
                >
                  <GearSix className="h-4 w-4 shrink-0" />
                  <span className="truncate">Datos maestros</span>
                </Link>

                <Link
                  to="/usuarios"
                  className={linkCls + " flex-none justify-start"}
                  activeProps={{
                    className: `${linkCls} flex-none justify-start ${activeLinkCls}`,
                  }}
                >
                  <UsersThree className="h-4 w-4 shrink-0" />
                  <span className="truncate">Usuarios</span>
                </Link>
              </>
            )}
          </nav>

          <div className="relative mt-auto border-t border-sidebar-border p-3 sm:p-4">
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-xs font-bold text-primary-foreground shadow-glow">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
                  Sesión activa
                </p>
                <p className="truncate text-xs font-medium text-sidebar-foreground/80">
                  {user.email}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-sidebar-foreground/40">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle className="border border-white/10 bg-white/5 text-sidebar-foreground hover:bg-white/10 hover:text-white" />

              <button
                type="button"
                onClick={signOut}
                disabled={isSigningOut}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-rose-300/25 bg-rose-400/10 px-3 text-sm font-semibold text-rose-100 transition-all hover:border-rose-300/40 hover:bg-rose-400/20 disabled:cursor-wait disabled:opacity-60 active:scale-[0.98]"
              >
                <SignOut className="h-4 w-4" />
                <span>
                  {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
