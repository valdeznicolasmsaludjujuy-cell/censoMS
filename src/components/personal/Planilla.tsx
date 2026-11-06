import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PAGE = 20;

export function Planilla({ controlado, titulo }: { controlado: boolean; titulo: string }) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["planilla", controlado, page, q],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let s = supabase.from("v_planilla").select("*", { count: "exact" }).eq("controlado", controlado);
      if (q.trim()) {
        const t = q.trim().replace(/[,()]/g, "");
        s = s.or(`apellido_nombre.ilike.%${t}%,dni.ilike.%${t}%,cuil.ilike.%${t}%`);
      }
      const { data, count, error } = await s.order("orden").range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });
  const total = data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{total} registros</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar nombre, DNI o CUIL" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
            <tr>{["Orden", "UDO", "Apellido y nombre", "CUIL", "DNI", "Categoría", "Lugar de trabajo", ""].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>}
            {data?.rows.map((r) => (
              <tr key={r.id_legajo} className="border-t hover:bg-muted/50">
                <td className="px-3 py-2 font-mono">{r.orden}</td>
                <td className="px-3 py-2">{r.udo_codigo}</td>
                <td className="px-3 py-2 font-medium">{r.apellido_nombre}</td>
                <td className="px-3 py-2 font-mono">{r.cuil}</td>
                <td className="px-3 py-2 font-mono">{r.dni}</td>
                <td className="px-3 py-2">{r.categoria ?? "—"}</td>
                <td className="px-3 py-2">{r.lugar_trabajo ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditId(r.id_legajo)}><Pencil className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 text-sm">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
        <span>Página {page + 1} de {pages}</span>
        <Button variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </div>
      {editId && <Editor id={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}

type Opt = { id: number; label: string };
function useCat(table: string, idCol: string, filter?: [string, string]) {
  return useQuery({
    queryKey: ["cat", table, filter],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let s: any = (supabase as any).from(table).select(`${idCol}, descripcion`).order("descripcion");
      if (filter) s = s.eq(filter[0], filter[1]);
      const { data, error } = await s;
      if (error) throw error;
      return (data as Record<string, unknown>[]).map((d) => ({ id: d[idCol] as number, label: d.descripcion as string })) as Opt[];
    },
  });
}

function Sel({ label, value, onChange, opts }: { label: string; value: number | null; onChange: (v: number | null) => void; opts?: Opt[] }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
        <option value="">—</option>
        {opts?.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
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
      const { data, error } = await supabase.from("legajo").select("*, personas(*)").eq("id_legajo", id).single();
      if (error) throw error;
      setF(data);
      return data;
    },
  });
  const cats = {
    udo: useCat("udos_presupuestarias", "id_udo"),
    rel: useCat("relaciones_laborales", "id_relacion_laboral"),
    cat: useCat("categorias", "id_categoria"),
    esc: useCat("escalafones", "id_escalafon"),
    agr: useCat("agrupamientos", "id_agrupamiento"),
    fun: useCat("funciones", "id_funcion"),
    lug: useCat("lugares_trabajo", "id_lugar"),
    tit: useCat("titulos", "id_titulo"),
    mh: useCat("adicionales", "id_adicional", ["tipo", "MAYOR_HORARIO"]),
    jef: useCat("adicionales", "id_adicional", ["tipo", "JEFATURA"]),
  };
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  const setP = (k: string, v: unknown) => setF({ ...f, personas: { ...f.personas, [k]: v } });

  async function save() {
    const p = f.personas;
    if (p.dni && !/^\d{7,8}$/.test(p.dni)) return toast.error("El DNI debe tener 7 u 8 dígitos");
    if (p.cuil && !/^\d{11}$/.test(p.cuil)) return toast.error("El CUIL debe tener 11 dígitos");
    setSaving(true);
    const e1 = (await supabase.from("personas").update({ apellido_nombre: p.apellido_nombre, dni: p.dni || null, cuil: p.cuil || null, sexo: p.sexo || null, fecha_nacimiento: p.fecha_nacimiento || null, id_titulo: p.id_titulo }).eq("id_persona", p.id_persona)).error;
    const e2 = e1 ?? (await supabase.from("legajo").update({
      id_udo: f.id_udo, id_relacion_laboral: f.id_relacion_laboral, id_categoria: f.id_categoria, id_agrupamiento: f.id_agrupamiento,
      id_funcion: f.id_funcion, id_lugar: f.id_lugar, id_adic_mayor_horario: f.id_adic_mayor_horario, id_adic_jefatura: f.id_adic_jefatura,
      afectado_tipo: f.afectado_tipo || null, observacion: f.observacion || null,
      controlado: true, controlado_at: f.controlado_at ?? new Date().toISOString(),
    }).eq("id_legajo", id)).error;
    setSaving(false);
    if (e2) return toast.error(e2.message);
    toast.success("Datos guardados y movidos a Datos controlados");
    qc.invalidateQueries({ queryKey: ["planilla"] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{f ? `Orden ${f.orden} — ${f.personas.apellido_nombre}` : "Cargando…"}</DialogTitle></DialogHeader>
        {f && (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase text-primary">Datos personales</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Apellido y nombre</Label><Input value={f.personas.apellido_nombre} onChange={(e) => setP("apellido_nombre", e.target.value)} /></div>
                <div className="space-y-1"><Label>DNI</Label><Input value={f.personas.dni ?? ""} onChange={(e) => setP("dni", e.target.value)} /></div>
                <div className="space-y-1"><Label>CUIL</Label><Input value={f.personas.cuil ?? ""} onChange={(e) => setP("cuil", e.target.value)} /></div>
                <div className="space-y-1"><Label>Sexo</Label>
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.personas.sexo ?? ""} onChange={(e) => setP("sexo", e.target.value)}>
                    <option value="">—</option><option>FEMENINO</option><option>MASCULINO</option>
                  </select></div>
                <div className="space-y-1"><Label>Fecha de nacimiento</Label><Input type="date" value={f.personas.fecha_nacimiento ?? ""} onChange={(e) => setP("fecha_nacimiento", e.target.value)} /></div>
                <div className="col-span-2"><Sel label="Título" value={f.personas.id_titulo} onChange={(v) => setP("id_titulo", v)} opts={cats.tit.data} /></div>
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase text-primary">Datos laborales</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Sel label="UDO presupuestaria" value={f.id_udo} onChange={(v) => set("id_udo", v)} opts={cats.udo.data} /></div>
                <Sel label="Situación de revista" value={f.id_relacion_laboral} onChange={(v) => set("id_relacion_laboral", v)} opts={cats.rel.data} />
                <Sel label="Categoría" value={f.id_categoria} onChange={(v) => set("id_categoria", v)} opts={cats.cat.data} />
                <Sel label="Agrupamiento" value={f.id_agrupamiento} onChange={(v) => set("id_agrupamiento", v)} opts={cats.agr.data} />
                <Sel label="Función" value={f.id_funcion} onChange={(v) => set("id_funcion", v)} opts={cats.fun.data} />
                <div className="col-span-2"><Sel label="Lugar de trabajo" value={f.id_lugar} onChange={(v) => set("id_lugar", v)} opts={cats.lug.data} /></div>
                <Sel label="Adic. mayor horario" value={f.id_adic_mayor_horario} onChange={(v) => set("id_adic_mayor_horario", v)} opts={cats.mh.data} />
                <Sel label="Adic. por jefatura" value={f.id_adic_jefatura} onChange={(v) => set("id_adic_jefatura", v)} opts={cats.jef.data} />
                <div className="space-y-1"><Label>Afectado</Label>
                  <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.afectado_tipo ?? ""} onChange={(e) => set("afectado_tipo", e.target.value)}>
                    <option value="">—</option><option>NO</option><option>AFECTADO EXTERNO</option><option>AFECTADO INTERNO</option><option>OTRO</option>
                  </select></div>
                <div className="space-y-1"><Label>Observación</Label><Input value={f.observacion ?? ""} onChange={(e) => set("observacion", e.target.value)} /></div>
              </div>
            </section>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={!f || saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
