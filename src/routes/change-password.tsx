import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, CircleNotch, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { completeOwnPasswordSetup } from "@/components/admin/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Route = createFileRoute("/change-password")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!data.user.app_metadata?.["must_change_password"]) throw redirect({ to: "/planilla" });
    return { email: data.user.email ?? "" };
  },
  head: () => ({
    meta: [{ title: "Cambiar contraseña — Gestión de Personal" }],
  }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { email } = Route.useRouteContext();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      await completeOwnPasswordSetup({ data: { password } });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Contraseña actualizada. Ingresá nuevamente con tu nueva contraseña.");
      navigate({ to: "/auth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la contraseña.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />

      <div className="glass-panel relative w-full max-w-md rounded-[2rem] border border-border/60 p-6 shadow-lift sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <ThemeToggle className="border border-border bg-background text-foreground hover:bg-accent" />
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Ministerio de Salud
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
            Creá tu contraseña personal
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            La contraseña temporal de <span className="font-semibold text-foreground">{email}</span>{" "}
            debe reemplazarse antes de continuar.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Usá entre 12 y 72 caracteres.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          <Button className="mt-2 w-full" size="lg" type="submit" disabled={saving}>
            {saving ? (
              <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {saving ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
