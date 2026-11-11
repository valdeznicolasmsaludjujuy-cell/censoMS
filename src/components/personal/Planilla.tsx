import { useEffect, useState, type FormEvent } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowsClockwise,
  CheckSquare,
  ClipboardText,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  Trash,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PAGE = 20;

const selectCls =
  "h-11 w-full rounded-xl border border-input bg-card/80 px-3.5 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("es-AR") || "?"
  );
}

export function Planilla({ controlado, titulo }: { controlado: boolean; titulo: string }) {
  const queryClient = useQueryClient();
  const adminRole = useQuery({
    queryKey: ["admin-role", "current"],
    queryFn: async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
  });
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["planilla", controlado, page, q],
    placeholderData: keepPreviousData,
    refetchInterval: 15000,
    queryFn: async () => {
      let s = supabase
        .from("v_planilla")
        .select("id_legajo,controlado,apellido_nombre,dni,cuil,udo_codigo,categoria", {
          count: "exact",
        })
        .eq("controlado", controlado);
      if (q.trim()) {
        const t = q.trim().replace(/[,()]/g, "");
        s = s.or(`apellido_nombre.ilike.%${t}%,dni.ilike.%${t}%,cuil.ilike.%${t}%`);
      }
      const { data, count, error } = await s
        .order("id_legajo", { ascending: false })
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });
  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  useEffect(() => {
    if (adminRole.error) {
      toast.error(`No se pudo verificar el permiso de administración: ${adminRole.error.message}`);
    }
  }, [adminRole.error]);

  async function deleteRecord() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const { error } = await supabase.rpc("eliminar_persona_legajo", {
        p_id_legajo: deleteTarget.id,
      });
      if (error) throw error;

      toast.success("Registro eliminado");
      setDeleteTarget(null);
      if (page > 0 && data?.rows.length === 1) setPage(page - 1);
      await queryClient.invalidateQueries({ queryKey: ["planilla"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el registro");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-5 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {controlado ? (
              <CheckSquare className="h-3.5 w-3.5" />
            ) : (
              <ClipboardText className="h-3.5 w-3.5" />
            )}
            Gestión de personal
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{titulo}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {controlado
              ? "Personas cuyos datos ya fueron revisados."
              : "Revisá y completá la información del personal."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70"
             
            />
            <Input
              className="pl-10"
              placeholder="Buscar nombre, DNI o CUIL"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              aria-label="Buscar por nombre, DNI o CUIL"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => void refetch()}
              aria-label="Actualizar listado"
              title="Actualizar listado"
            >
              <ArrowsClockwise
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
               
              />
            </Button>
            {!controlado && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Agregar persona
              </Button>
            )}
          </div>
        </div>
      </div>
<<<<<<< HEAD
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/90 shadow-soft backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              {controlado ? (
                <CheckSquare className="h-5 w-5" />
              ) : (
                <ClipboardText className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold">Listado de personas</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {total} {total === 1 ? "registro" : "registros"}
              </p>
            </div>
=======
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold">Listado de personas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total} {total === 1 ? "registro" : "registros"}
            </p>
>>>>>>> c07c827 (dashbord e interfaz)
          </div>
          <span
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold " +
              (controlado
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400")
            }
          >
            <span
              className={
                "h-1.5 w-1.5 rounded-full " +
                (controlado ? "bg-emerald-500" : "bg-amber-500")
              }
            />
            {controlado ? "Revisados" : "Pendientes"}
          </span>
        </div>
        {isError ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="mb-4 flex h-10 w-10 items-center justify-center text-destructive">
              <WarningCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">No se pudieron cargar los registros</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Ocurrió un error inesperado al consultar los datos."}
            </p>
            <Button className="mt-5" variant="outline" onClick={() => void refetch()}>
              <ArrowsClockwise className="h-4 w-4" /> Reintentar
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  {["UDO", "Apellido y nombre", "CUIL", "DNI", "Categoría", ""].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={h === "" ? "px-5 py-3.5 text-right" : "px-5 py-3.5"}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
                      Cargando registros…
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  data?.rows.map((r) => (
                    <tr
                      key={r.id_legajo}
                      className="group border-t border-border/50 transition-colors hover:bg-primary/[0.04]"
                    >
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-lg bg-muted px-2 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
                          {r.udo_codigo ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[11px] font-bold text-primary-foreground shadow-sm">
                            {initialsOf(r.apellido_nombre ?? "?")}
                          </div>
                          <span className="font-semibold">{r.apellido_nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {r.cuil ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {r.dni ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full border border-border/60 bg-muted/50 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {r.categoria ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            aria-label={`Editar ${r.apellido_nombre}`}
                            onClick={() => setEditId(r.id_legajo)}
                          >
                            <PencilSimple className="h-4 w-4" />
                          </Button>
                          {adminRole.data && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Eliminar ${r.apellido_nombre}`}
                              disabled={r.id_legajo === null}
                              onClick={() => {
                                const id = r.id_legajo;
                                if (id !== null) {
                                  setDeleteTarget({ id, name: r.apellido_nombre ?? "" });
                                }
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!isLoading && !data?.rows.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground/60">
                        <UsersThree className="h-6 w-6" />
                      </div>
                      <p className="mt-4 font-semibold">
                        {q.trim()
                          ? "No encontramos coincidencias"
                          : "Todavía no hay registros para mostrar"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {q.trim()
                          ? "Probá con otro nombre, DNI o CUIL."
                          : "Cuando haya personas disponibles, aparecerán en este listado."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!isError && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            {total === 0
              ? "Sin resultados"
              : `Mostrando ${page * PAGE + 1}–${Math.min((page + 1) * PAGE, total)} de ${total}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
              Página {page + 1} de {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
      {editId && <Editor id={editId} onClose={() => setEditId(null)} />}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el legajo de {deleteTarget?.name} y su historial asociado. Si no tiene
              otros legajos, también se eliminarán sus datos personales. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void deleteRecord()} disabled={deleting}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {createOpen && (
        <CrearPersonaDialog
          onClose={() => setCreateOpen(false)}
          onSaved={async () => {
            setPage(0);
            setQ("");
            await queryClient.invalidateQueries({ queryKey: ["planilla"] });
          }}
        />
      )}
    </div>
  );
}

type Opt = { id: number; label: string };
function useCat(
  table: string,
  idCol: string,
  filter?: [string, string],
  labelCol = "descripcion",
  secondaryCol?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["cat", table, filter, labelCol, secondaryCol],
    queryFn: async () => {
      const columns = [idCol, labelCol, ...(secondaryCol ? [secondaryCol] : [])].join(", ");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let s: any = (supabase as any).from(table).select(columns).order(labelCol);
      if (filter) s = s.eq(filter[0], filter[1]);
      const { data, error } = await s;
      if (error) throw error;
      return (data as Record<string, unknown>[]).map((d) => ({
        id: d[idCol] as number,
        label: secondaryCol
          ? `${d[secondaryCol] as string} · ${d[labelCol] as string}`
          : (d[labelCol] as string),
      })) as Opt[];
    },
    enabled,
  });
}

function Sel({
  label,
  value,
  onChange,
  opts,
  disabled = false,
  loading = false,
  error,
  emptyMessage = "No hay opciones disponibles",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  opts?: Opt[] | undefined;
  disabled?: boolean;
  loading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}) {
  const placeholder = disabled
    ? "Seleccioná primero el nivel anterior"
    : loading
      ? "Cargando opciones…"
      : error
        ? "No se pudieron cargar las opciones"
        : opts?.length
          ? "—"
          : emptyMessage;

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <select
        className={selectCls}
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{placeholder}</option>
        {opts?.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

function Editor({ id, onClose }: { id: number; onClose: () => void }) {
  const qc = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [f, setF] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useQuery({
    queryKey: ["legajo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legajo")
        .select("*, personas(*)")
        .eq("id_legajo", id)
        .single();
      if (error) throw error;
      let id_direccion: number | null = null;
      let id_unidad: number | null = null;
      let id_secretaria: number | null = null;
      let id_udo: number | null = null;
      if (data.id_sector) {
        const { data: sector, error: sectorError } = await supabase
          .from("sectores")
          .select("id_unidad")
          .eq("id_sector", data.id_sector)
          .single();
        if (sectorError) throw sectorError;
        id_unidad = sector.id_unidad;
        const { data: unidad, error: unidadError } = await supabase
          .from("unidades_organizativas")
          .select("id_direccion")
          .eq("id_unidad", id_unidad)
          .single();
        if (unidadError) throw unidadError;
        id_direccion = unidad.id_direccion;
        const { data: direccion, error: direccionError } = await supabase
          .from("direcciones")
          .select("id_secretaria")
          .eq("id_direccion", id_direccion)
          .single();
        if (direccionError) throw direccionError;
        id_secretaria = direccion.id_secretaria;
        const { data: secretaria, error: secretariaError } = await supabase
          .from("secretarias")
          .select("id_udo")
          .eq("id_secretaria", id_secretaria)
          .single();
        if (secretariaError) throw secretariaError;
        id_udo = secretaria.id_udo;
      }
      const form = { ...data, id_udo, id_secretaria, id_direccion, id_unidad };
      setF(form);
      return form;
    },
  });
  const cats = {
    udo: useCat("udos_presupuestarias", "id_udo"),
    sec: useCat(
      "secretarias",
      "id_secretaria",
      f?.id_udo ? ["id_udo", String(f.id_udo)] : undefined,
      "nombre",
      undefined,
      Boolean(f?.id_udo),
    ),
    dir: useCat(
      "direcciones",
      "id_direccion",
      f?.id_secretaria ? ["id_secretaria", String(f.id_secretaria)] : undefined,
      "nombre",
      undefined,
      Boolean(f?.id_secretaria),
    ),
    uni: useCat(
      "unidades_organizativas",
      "id_unidad",
      f?.id_direccion ? ["id_direccion", String(f.id_direccion)] : undefined,
      "nombre",
      "tipo",
      Boolean(f?.id_direccion),
    ),
    sector: useCat(
      "sectores",
      "id_sector",
      f?.id_unidad ? ["id_unidad", String(f.id_unidad)] : undefined,
      "nombre",
      undefined,
      Boolean(f?.id_unidad),
    ),
    rel: useCat("relaciones_laborales", "id_relacion_laboral"),
    cat: useCat("categorias", "id_categoria"),
    esc: useCat("escalafones", "id_escalafon"),
    agr: useCat("agrupamientos", "id_agrupamiento"),
    fun: useCat("funciones", "id_funcion"),
  };
  const set = (k: string, v: unknown) => setF((current: typeof f) => ({ ...current, [k]: v }));
  const setP = (k: string, v: unknown) =>
    setF((current: typeof f) => ({
      ...current,
      personas: { ...current.personas, [k]: v },
    }));

  async function save(): Promise<void> {
    const p = f.personas;
    if (p.dni && !/^\d{7,8}$/.test(p.dni)) {
      toast.error("El DNI debe tener 7 u 8 dígitos");
      return;
    }
    if (p.cuil && !/^\d{11}$/.test(p.cuil)) {
      toast.error("El CUIL debe tener 11 dígitos");
      return;
    }
    setSaving(true);
    const e1 = (
      await supabase
        .from("personas")
        .update({
          apellido_nombre: p.apellido_nombre,
          dni: p.dni || null,
          cuil: p.cuil || null,
          sexo: p.sexo || null,
          fecha_nacimiento: p.fecha_nacimiento || null,
        })
        .eq("id_persona", p.id_persona)
    ).error;
    const e2 =
      e1 ??
      (
        await supabase
          .from("legajo")
          .update({
            id_sector: f.id_sector,
            id_relacion_laboral: f.id_relacion_laboral,
            id_categoria: f.id_categoria,
            id_agrupamiento: f.id_agrupamiento,
            id_funcion: f.id_funcion,
            controlado: true,
            controlado_at: f.controlado_at ?? new Date().toISOString(),
          })
          .eq("id_legajo", id)
      ).error;
    setSaving(false);
    if (e2) {
      toast.error(e2.message);
      return;
    }
    toast.success("Datos guardados y movidos a Datos controlados");
    qc.invalidateQueries({ queryKey: ["planilla"] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f ? f.personas.apellido_nombre : "Cargando…"}</DialogTitle>
        </DialogHeader>
        {f && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 border-b border-border/60 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                Datos personales
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Apellido y nombre</Label>
                  <Input
                    value={f.personas.apellido_nombre}
                    onChange={(e) => setP("apellido_nombre", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>DNI</Label>
                  <Input
                    value={f.personas.dni ?? ""}
                    onChange={(e) => setP("dni", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CUIL</Label>
                  <Input
                    value={f.personas.cuil ?? ""}
                    onChange={(e) => setP("cuil", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sexo</Label>
                  <select
                    className={selectCls}
                    value={f.personas.sexo ?? ""}
                    onChange={(e) => setP("sexo", e.target.value)}
                  >
                    <option value="">—</option>
                    <option>FEMENINO</option>
                    <option>MASCULINO</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    value={f.personas.fecha_nacimiento ?? ""}
                    onChange={(e) => setP("fecha_nacimiento", e.target.value)}
                  />
                </div>
              </div>
            </section>
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 border-b border-border/60 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                Datos laborales
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Sel
                    label="UDO presupuestaria"
                    value={f.id_udo}
                    onChange={(v) => {
                      set("id_udo", v);
                      set("id_secretaria", null);
                      set("id_direccion", null);
                      set("id_unidad", null);
                      set("id_sector", null);
                    }}
                    opts={cats.udo.data}
                  />
                </div>
                <Sel
                  label="Secretaría"
                  value={f.id_secretaria}
                  onChange={(v) => {
                    set("id_secretaria", v);
                    set("id_direccion", null);
                    set("id_unidad", null);
                    set("id_sector", null);
                  }}
                  opts={cats.sec.data}
                  disabled={!f.id_udo}
                  loading={cats.sec.isFetching}
                  error={cats.sec.error}
                  emptyMessage="No hay secretarías asociadas a esta UDO"
                />
                <Sel
                  label="Dirección"
                  value={f.id_direccion}
                  onChange={(v) => {
                    set("id_direccion", v);
                    set("id_unidad", null);
                    set("id_sector", null);
                  }}
                  opts={cats.dir.data}
                  disabled={!f.id_secretaria}
                  loading={cats.dir.isFetching}
                  error={cats.dir.error}
                  emptyMessage="No hay direcciones asociadas a esta secretaría"
                />
                <Sel
                  label="Unidad organizativa (Subdirección / Coordinación)"
                  value={f.id_unidad}
                  onChange={(v) => {
                    set("id_unidad", v);
                    set("id_sector", null);
                  }}
                  opts={cats.uni.data}
                  disabled={!f.id_direccion}
                  loading={cats.uni.isFetching}
                  error={cats.uni.error}
                  emptyMessage="No hay unidades organizativas asociadas a esta dirección"
                />
                <div className="sm:col-span-2">
                  <Sel
                    label="Sector"
                    value={f.id_sector}
                    onChange={(v) => set("id_sector", v)}
                    opts={cats.sector.data}
                    disabled={!f.id_unidad}
                    loading={cats.sector.isFetching}
                    error={cats.sector.error}
                    emptyMessage="No hay sectores asociados a esta unidad"
                  />
                </div>
                <Sel
                  label="Situación de revista"
                  value={f.id_relacion_laboral}
                  onChange={(v) => set("id_relacion_laboral", v)}
                  opts={cats.rel.data}
                />
                <Sel
                  label="Categoría"
                  value={f.id_categoria}
                  onChange={(v) => set("id_categoria", v)}
                  opts={cats.cat.data}
                />
                <Sel
                  label="Agrupamiento"
                  value={f.id_agrupamiento}
                  onChange={(v) => set("id_agrupamiento", v)}
                  opts={cats.agr.data}
                />
                <Sel
                  label="Función"
                  value={f.id_funcion}
                  onChange={(v) => set("id_funcion", v)}
                  opts={cats.fun.data}
                />
              </div>
            </section>
          </div>
        )}
        <DialogFooter className="border-t border-border/60 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!f || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PersonaNueva = {
  apellido_nombre: string;
  dni: string;
  cuil: string;
  sexo: string;
  fecha_nacimiento: string;
  id_sector: string;
  id_secretaria: string;
  id_direccion: string;
  id_unidad: string;
  id_relacion_laboral: string;
  id_categoria: string;
  id_agrupamiento: string;
  id_funcion: string;
  id_udo: string;
  dependencia: string;
};
type PersonaNuevaTexto = {
  [K in keyof PersonaNueva]: PersonaNueva[K] extends string ? K : never;
}[keyof PersonaNueva];

const personaNuevaInicial: PersonaNueva = {
  apellido_nombre: "",
  dni: "",
  cuil: "",
  sexo: "",
  fecha_nacimiento: "",
  id_sector: "",
  id_secretaria: "",
  id_direccion: "",
  id_unidad: "",
  id_relacion_laboral: "",
  id_categoria: "",
  id_agrupamiento: "",
  id_funcion: "",
  id_udo: "",
  dependencia: "",
};

function CrearPersonaDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [f, setF] = useState(personaNuevaInicial);
  const [saving, setSaving] = useState(false);
  const cats = {
    udo: useCat("udos_presupuestarias", "id_udo"),
    sec: useCat(
      "secretarias",
      "id_secretaria",
      f.id_udo ? ["id_udo", f.id_udo] : undefined,
      "nombre",
      undefined,
      Boolean(f.id_udo),
    ),
    dir: useCat(
      "direcciones",
      "id_direccion",
      f.id_secretaria ? ["id_secretaria", f.id_secretaria] : undefined,
      "nombre",
      undefined,
      Boolean(f.id_secretaria),
    ),
    uni: useCat(
      "unidades_organizativas",
      "id_unidad",
      f.id_direccion ? ["id_direccion", f.id_direccion] : undefined,
      "nombre",
      "tipo",
      Boolean(f.id_direccion),
    ),
    sector: useCat(
      "sectores",
      "id_sector",
      f.id_unidad ? ["id_unidad", f.id_unidad] : undefined,
      "nombre",
      undefined,
      Boolean(f.id_unidad),
    ),
    rel: useCat("relaciones_laborales", "id_relacion_laboral"),
    cat: useCat("categorias", "id_categoria"),
    agr: useCat("agrupamientos", "id_agrupamiento"),
    fun: useCat("funciones", "id_funcion"),
  };
  const catalogError = Object.values(cats).find((query) => query.isError)?.error;
  const set = <K extends keyof PersonaNueva>(key: K, value: PersonaNueva[K]) =>
    setF((current) => ({ ...current, [key]: value }));

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dni = f.dni.trim();
    const cuil = f.cuil.trim();
    if (dni && !/^\d{7,8}$/.test(dni)) {
      toast.error("El DNI debe tener 7 u 8 dígitos");
      return;
    }
    if (cuil && !/^\d{11}$/.test(cuil)) {
      toast.error("El CUIL debe tener 11 dígitos");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.rpc("crear_persona_legajo", {
        p_persona: {
          apellido_nombre: f.apellido_nombre.trim(),
          dni: dni || null,
          cuil: cuil || null,
          sexo: f.sexo || null,
          fecha_nacimiento: f.fecha_nacimiento || null,
        },
        p_legajo: {
          id_sector: f.id_sector ? Number(f.id_sector) : null,
          id_relacion_laboral: f.id_relacion_laboral ? Number(f.id_relacion_laboral) : null,
          id_categoria: f.id_categoria ? Number(f.id_categoria) : null,
          id_agrupamiento: f.id_agrupamiento ? Number(f.id_agrupamiento) : null,
          id_funcion: f.id_funcion ? Number(f.id_funcion) : null,
          dependencia: f.dependencia.trim() || null,
        },
      });
      if (error) throw error;
      toast.success("La persona se agregó a la planilla pendiente");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar la persona");
    } finally {
      setSaving(false);
    }
  }

  const input = (label: string, key: PersonaNuevaTexto, type = "text", required = false) => (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        type={type}
        required={required}
        value={f[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar persona</DialogTitle>
          <DialogDescription>
            Completá los datos personales y laborales. Solo apellido y nombre es obligatorio.
          </DialogDescription>
        </DialogHeader>
        {catalogError && (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar algunos catálogos: {catalogError.message}
          </p>
        )}
        <form id="crear-persona-form" onSubmit={save} className="space-y-6">
          <section className="space-y-3">
            <h3 className="border-b border-border/60 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Datos personales
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {input("Apellido y nombre", "apellido_nombre", "text", true)}
              </div>
              {input("DNI", "dni", "text")}
              {input("CUIL", "cuil", "text")}
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <select
                  className={selectCls}
                  value={f.sexo}
                  onChange={(e) => set("sexo", e.target.value)}
                >
                  <option value="">—</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="MASCULINO">Masculino</option>
                </select>
              </div>
              {input("Fecha de nacimiento", "fecha_nacimiento", "date")}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="border-b border-border/60 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              Datos del legajo
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Sel
                label="UDO presupuestaria"
                value={f.id_udo ? Number(f.id_udo) : null}
                onChange={(v) => {
                  set("id_udo", v?.toString() ?? "");
                  set("id_secretaria", "");
                  set("id_direccion", "");
                  set("id_unidad", "");
                  set("id_sector", "");
                }}
                opts={cats.udo.data}
              />
              <Sel
                label="Secretaría"
                value={f.id_secretaria ? Number(f.id_secretaria) : null}
                onChange={(v) => {
                  set("id_secretaria", v?.toString() ?? "");
                  set("id_direccion", "");
                  set("id_unidad", "");
                  set("id_sector", "");
                }}
                opts={cats.sec.data}
                disabled={!f.id_udo}
                loading={cats.sec.isFetching}
                error={cats.sec.error}
                emptyMessage="No hay secretarías asociadas a esta UDO"
              />
              <Sel
                label="Dirección"
                value={f.id_direccion ? Number(f.id_direccion) : null}
                onChange={(v) => {
                  set("id_direccion", v?.toString() ?? "");
                  set("id_unidad", "");
                  set("id_sector", "");
                }}
                opts={cats.dir.data}
                disabled={!f.id_secretaria}
                loading={cats.dir.isFetching}
                error={cats.dir.error}
                emptyMessage="No hay direcciones asociadas a esta secretaría"
              />
              <Sel
                label="Unidad organizativa (Subdirección / Coordinación)"
                value={f.id_unidad ? Number(f.id_unidad) : null}
                onChange={(v) => {
                  set("id_unidad", v?.toString() ?? "");
                  set("id_sector", "");
                }}
                opts={cats.uni.data}
                disabled={!f.id_direccion}
                loading={cats.uni.isFetching}
                error={cats.uni.error}
                emptyMessage="No hay unidades organizativas asociadas a esta dirección"
              />
              <Sel
                label="Sector"
                value={f.id_sector ? Number(f.id_sector) : null}
                onChange={(v) => set("id_sector", v?.toString() ?? "")}
                opts={cats.sector.data}
                disabled={!f.id_unidad}
                loading={cats.sector.isFetching}
                error={cats.sector.error}
                emptyMessage="No hay sectores asociados a esta unidad"
              />
              <Sel
                label="Relación laboral"
                value={f.id_relacion_laboral ? Number(f.id_relacion_laboral) : null}
                onChange={(v) => set("id_relacion_laboral", v?.toString() ?? "")}
                opts={cats.rel.data}
              />
              <Sel
                label="Categoría"
                value={f.id_categoria ? Number(f.id_categoria) : null}
                onChange={(v) => set("id_categoria", v?.toString() ?? "")}
                opts={cats.cat.data}
              />
              <Sel
                label="Agrupamiento"
                value={f.id_agrupamiento ? Number(f.id_agrupamiento) : null}
                onChange={(v) => set("id_agrupamiento", v?.toString() ?? "")}
                opts={cats.agr.data}
              />
              <Sel
                label="Función"
                value={f.id_funcion ? Number(f.id_funcion) : null}
                onChange={(v) => set("id_funcion", v?.toString() ?? "")}
                opts={cats.fun.data}
              />
              {input("Dependencia", "dependencia")}
            </div>
          </section>
        </form>
        <DialogFooter className="border-t border-border/60 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="crear-persona-form" disabled={saving}>
            {saving ? "Guardando…" : "Guardar persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
