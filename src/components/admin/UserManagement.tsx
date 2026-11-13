import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changeManagedUserRole,
  createManagedUser,
  deleteManagedUser,
  listUsers,
  resetManagedUserPassword,
} from "@/components/admin/users.functions";

const roleLabels = {
  admin: "Administrador",
  carga: "Carga de planilla",
  consulta: "Consulta (solo lectura)",
} as const;

type UserRole = keyof typeof roleLabels;
type ManagedUser = Awaited<ReturnType<typeof listUsers>>[number];

function initialsOf(email: string) {
  return (
    email
      .split("@")[0]
      ?.split(/[._-]/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toLocaleUpperCase("es-AR") || "?"
  );
}

function UserManagement() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("carga");
  const [passwordTarget, setPasswordTarget] = useState<ManagedUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const createMutation = useMutation({
    mutationFn: () => createManagedUser({ data: { email, password, role } }),
    gcTime: 0,
    onSuccess: async (created) => {
      toast.success(
        `Se creó la cuenta de ${created.email}. Entregá la contraseña por un canal seguro.`,
      );
      setCreateOpen(false);
      setEmail("");
      setPassword("");
      setRole("carga");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo crear el usuario"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role: nextRole }: { userId: string; role: UserRole }) =>
      changeManagedUserRole({ data: { userId, role: nextRole } }),
    gcTime: 0,
    onSuccess: async () => {
      toast.success("Rol actualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin-role"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "No se pudo actualizar el rol");
      void queryClient.invalidateQueries({ queryKey: ["admin-role"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      resetManagedUserPassword({
        data: { userId: passwordTarget?.id ?? "", password: temporaryPassword },
      }),
    gcTime: 0,
    onSuccess: async () => {
      toast.success("Contraseña temporal actualizada. Se pedirá cambiarla en el próximo ingreso.");
      setPasswordTarget(null);
      setTemporaryPassword("");
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo cambiar la contraseña"),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteManagedUser({ data: { userId } }),
    gcTime: 0,
    onSuccess: async () => {
      toast.success("La cuenta fue eliminada");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => toast.error(error.message || "No se pudo eliminar la cuenta"),
  });

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate();
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetPasswordMutation.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <Users className="h-3.5 w-3.5" strokeWidth={1.8} />
          Administración
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Gestión de usuarios</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Creá cuentas, asigná permisos y restablecé contraseñas temporales. Las cuentas nuevas
          deberán cambiar su contraseña al ingresar por primera vez.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-4 w-4" strokeWidth={1.8} />
              </span>
              Cuentas de acceso
            </CardTitle>
            <CardDescription className="mt-1">
              Administrador: acceso completo. Carga: puede agregar y completar datos de toda la
              planilla. Consulta: solo lectura.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Actualizar usuarios"
              onClick={() => void usersQuery.refetch()}
              disabled={usersQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Agregar usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersQuery.isPending ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Cargando usuarios…</p>
          ) : usersQuery.error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">No se pudieron cargar las cuentas.</p>
              <p className="mt-1 text-muted-foreground">{usersQuery.error.message}</p>
            </div>
          ) : usersQuery.data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/60">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Email
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Rol
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Alta
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersQuery.data.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-border/50 transition-colors hover:bg-primary/[0.04]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[10px] font-bold text-primary-foreground shadow-sm">
                            {initialsOf(user.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{user.email}</p>
                            {user.mustChangePassword && (
                              <p className="mt-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                Cambio de contraseña pendiente
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <select
                          aria-label={`Rol de ${user.email}`}
                          value={user.role ?? ""}
                          disabled={roleMutation.isPending}
                          onChange={(event) =>
                            roleMutation.mutate({
                              userId: user.id,
                              role: event.target.value as UserRole,
                            })
                          }
                          className="h-10 w-full max-w-[230px] rounded-xl border border-input bg-card/80 px-3 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Asignar rol…
                          </option>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPasswordTarget(user);
                              setTemporaryPassword("");
                            }}
                          >
                            <KeyRound className="h-4 w-4" /> Contraseña temporal
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                            disabled={user.isCurrentUser || deleteMutation.isPending}
                            title={
                              user.isCurrentUser
                                ? "No podés eliminar la cuenta con la que iniciaste sesión"
                                : `Eliminar la cuenta de ${user.email}`
                            }
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!createMutation.isPending) setCreateOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input
                id="new-user-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-password">Contraseña temporal</Label>
              <Input
                id="new-user-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Debe tener entre 8 y 72 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-role">Rol inicial</Label>
              <select
                id="new-user-role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-11 w-full rounded-xl border border-input bg-card/80 px-3.5 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Compartí la contraseña temporal con el usuario por un canal seguro. El sistema le
              exigirá elegir una nueva al ingresar.
            </p>
            <DialogFooter className="border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando…" : "Crear cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el acceso de{" "}
              <span className="font-medium text-foreground">{deleteTarget?.email}</span>. Esta
              acción no se puede deshacer. Los registros de personal no se eliminarán.
              {deleteTarget?.role === "admin" &&
                " El sistema también impedirá eliminar la cuenta si es el último administrador."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending || !deleteTarget}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
            >
              {deleteMutation.isPending ? "Eliminando…" : "Eliminar cuenta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={passwordTarget !== null}
        onOpenChange={(open) => {
          if (!resetPasswordMutation.isPending && !open) {
            setPasswordTarget(null);
            setTemporaryPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Establecer contraseña temporal</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">{passwordTarget?.email}</p>
            <div className="space-y-2">
              <Label htmlFor="reset-user-password">Nueva contraseña temporal</Label>
              <Input
                id="reset-user-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">Debe tener entre 8 y 72 caracteres.</p>
            </div>
            <DialogFooter className="border-t border-border/60 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={resetPasswordMutation.isPending}
                onClick={() => {
                  setPasswordTarget(null);
                  setTemporaryPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { UserManagement };
