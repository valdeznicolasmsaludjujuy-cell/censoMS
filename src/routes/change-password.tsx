import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { completeOwnPasswordSetup } from "@/components/admin/users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 sm:p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Ministerio de Salud
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Creá tu contraseña personal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La contraseña temporal de {email} debe reemplazarse antes de continuar.
        </p>
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
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
