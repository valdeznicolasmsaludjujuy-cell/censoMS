import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Buildings,
  ChartBar,
  CheckSquare,
  CircleNotch,
  ShieldCheck,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ingresar — Gestión de Personal" },
      {
        name: "description",
        content: "Acceso al sistema de gestión de personal del Ministerio de Salud.",
      },
      { property: "og:title", content: "Ingresar — Gestión de Personal" },
      { property: "og:description", content: "Acceso al sistema de gestión de personal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1);
      if (rolesError) {
        await supabase.auth.signOut();
        throw rolesError;
      }
      if (!roles.length) {
        await supabase.auth.signOut();
        throw new Error(
          "Esta cuenta todavía no tiene un rol asignado. Contactá a un administrador.",
        );
      }

      navigate({
        to: data.user.app_metadata?.["must_change_password"] ? "/change-password" : "/planilla",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo ingresar");
    } finally {
      setLoading(false);
    }
  }

  return (
<<<<<<< HEAD
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-lift backdrop-blur-xl md:grid-cols-[1.05fr_1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-8 text-sidebar-foreground md:flex">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sidebar-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
              <Buildings className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
                Ministerio de Salud
              </p>
              <p className="mt-1 text-sm font-bold tracking-tight">Gestión de Personal</p>
            </div>
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_oklch(0.7_0.15_160/0.2)]" />
              Sistema operativo
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-[1.1] tracking-tight">
              Cada legajo,
              <br />
              <span className="text-brand-gradient">en su lugar.</span>
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sidebar-foreground/60">
              Centralizá altas, controles y reportes del personal en una sola plataforma.
            </p>
          </div>

          <div className="relative space-y-3">
            {[
              { icon: ShieldCheck, text: "Acceso seguro por roles" },
              { icon: CheckSquare, text: "Legajos siempre actualizados" },
              { icon: ChartBar, text: "Reportes en tiempo real" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-sm text-sidebar-foreground/75"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/5">
                  <Icon className="h-4 w-4" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <p className="relative text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/35">
            Uso interno · Ministerio de Salud
          </p>
=======
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-3xl border border-border/70 bg-card/95 p-6 shadow-2xl shadow-primary/5 backdrop-blur sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Ministerio de Salud
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
              Gestión de Personal
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá con tu cuenta institucional.
            </p>
          </div>
          <ThemeToggle className="border border-border bg-background text-foreground hover:bg-accent" />
>>>>>>> c07c827 (dashbord e interfaz)
        </div>

        <div className="relative p-6 sm:p-8 md:p-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 md:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-primary-foreground shadow-glow">
                <Buildings className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold tracking-tight">Gestión de Personal</p>
            </div>
            <ThemeToggle className="ml-auto border border-border bg-background text-foreground hover:bg-accent" />
          </div>

          <div className="mt-8 md:mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Acceso institucional
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ingresá con tu cuenta para continuar con la gestión de personal.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="nombre@salud.gob.ar"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? (
                <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <p className="mt-6 rounded-2xl border border-border/60 bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
            Las cuentas son administradas por el equipo autorizado.
          </p>
        </div>
      </div>
    </div>
  );
}
