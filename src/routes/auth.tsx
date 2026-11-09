import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-6 sm:p-8">
        <div className="mb-7">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Ministerio de Salud
          </p>
          <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
            Gestión de Personal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Ingresá con tu cuenta institucional.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Las cuentas son administradas por el equipo autorizado.
        </p>
      </div>
    </div>
  );
}
