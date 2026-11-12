import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheck,
  CircleX,
  FileUp,
  Plus,
  RefreshCw,
  ShieldAlert,
  SquarePen,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportarPersonalDialog } from "@/components/admin/ImportarPersonalDialog";
import { supabase } from "@/integrations/supabase/client";

type CatalogKey =
  | "udos_presupuestarias"
  | "secretarias"
  | "direcciones"
  | "unidades_organizativas"
  | "sectores"
  | "relaciones_laborales"
  | "escalafones"
  | "categorias"
  | "agrupamientos"
  | "funciones";

type CatalogItem = {
  id: number;
  label: string;
  detail: string;
  active: boolean | null;
  values?: Record<string, string>;
};

type CatalogField = {
  key: string;
  label: string;
  required?: boolean;
  optionsFrom?: CatalogKey;
  choices?: readonly { value: string; label: string }[];
};

type CatalogDefinition = {
  key: CatalogKey;
  title: string;
  group: "estructura" | "catalogos";
  fields: readonly CatalogField[];
  list: () => Promise<CatalogItem[]>;
  create: (values: Record<string, string>) => Promise<void>;
  update: (id: number, values: Record<string, string>) => Promise<void>;
  setActive?: (id: number, active: boolean) => Promise<void>;
};

type CatalogRows = Partial<Record<CatalogKey, CatalogItem[]>>;

const noOptions = [] as const;
const unidadTipos = [
  { value: "SUBDIRECCION", label: "Subdirección" },
  { value: "COORDINACION", label: "Coordinación" },
] as const;
function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function requiredValue(values: Record<string, string>, key: string) {
  const value = values[key]?.trim();
  if (!value) throw new Error("Completá todos los campos obligatorios.");
  return value;
}

function optionalValue(values: Record<string, string>, key: string) {
  return values[key]?.trim() || null;
}

function foreignKey(values: Record<string, string>, key: string) {
  const value = requiredValue(values, key);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0)
    throw new Error("Seleccioná una opción válida.");
  return parsed;
}

function optionalForeignKey(values: Record<string, string>, key: string) {
  const value = optionalValue(values, key);
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0)
    throw new Error("Seleccioná una opción válida.");
  return parsed;
}

async function applyState(key: CatalogKey, id: number, active: boolean) {
  const update = { estado: active };
  let error: { message: string } | null = null;
  switch (key) {
    case "udos_presupuestarias":
      ({ error } = await supabase.from(key).update(update).eq("id_udo", id));
      break;
    case "secretarias":
      ({ error } = await supabase.from(key).update(update).eq("id_secretaria", id));
      break;
    case "direcciones":
      ({ error } = await supabase.from(key).update(update).eq("id_direccion", id));
      break;
    case "unidades_organizativas":
      ({ error } = await supabase.from(key).update(update).eq("id_unidad", id));
      break;
    case "sectores":
      ({ error } = await supabase.from(key).update(update).eq("id_sector", id));
      break;
    case "relaciones_laborales":
      ({ error } = await supabase.from(key).update(update).eq("id_relacion_laboral", id));
      break;
    case "escalafones":
      ({ error } = await supabase.from(key).update(update).eq("id_escalafon", id));
      break;
    case "categorias":
      ({ error } = await supabase.from(key).update(update).eq("id_categoria", id));
      break;
    case "agrupamientos":
      ({ error } = await supabase.from(key).update(update).eq("id_agrupamiento", id));
      break;
    case "funciones":
      ({ error } = await supabase.from(key).update(update).eq("id_funcion", id));
      break;
  }
  assertNoError(error);
}

async function removeCatalogItem(key: CatalogKey, id: number) {
  let error: { message: string } | null = null;
  switch (key) {
    case "udos_presupuestarias":
      ({ error } = await supabase.from(key).delete().eq("id_udo", id));
      break;
    case "secretarias":
      ({ error } = await supabase.from(key).delete().eq("id_secretaria", id));
      break;
    case "direcciones":
      ({ error } = await supabase.from(key).delete().eq("id_direccion", id));
      break;
    case "unidades_organizativas":
      ({ error } = await supabase.from(key).delete().eq("id_unidad", id));
      break;
    case "sectores":
      ({ error } = await supabase.from(key).delete().eq("id_sector", id));
      break;
    case "relaciones_laborales":
      ({ error } = await supabase.from(key).delete().eq("id_relacion_laboral", id));
      break;
    case "escalafones":
      ({ error } = await supabase.from(key).delete().eq("id_escalafon", id));
      break;
    case "categorias":
      ({ error } = await supabase.from(key).delete().eq("id_categoria", id));
      break;
    case "agrupamientos":
      ({ error } = await supabase.from(key).delete().eq("id_agrupamiento", id));
      break;
    case "funciones":
      ({ error } = await supabase.from(key).delete().eq("id_funcion", id));
      break;
  }
  assertNoError(error);
}

const definitions: readonly CatalogDefinition[] = [
  {
    key: "udos_presupuestarias",
    title: "UDO presupuestarias",
    group: "estructura",
    fields: [
      { key: "codigo", label: "Código" },
      { key: "descripcion", label: "Descripción", required: true },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("udos_presupuestarias")
        .select("*")
        .order("descripcion");
      assertNoError(error);
      return (data ?? []).map((row) => ({
        id: row.id_udo,
        label: row.descripcion,
        detail: row.codigo ?? "",
        active: row.estado,
        values: { codigo: row.codigo ?? "", descripcion: row.descripcion },
      }));
    },
    create: async (values) => {
      const { error } = await supabase.from("udos_presupuestarias").insert({
        codigo: optionalValue(values, "codigo"),
        descripcion: requiredValue(values, "descripcion"),
      });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("udos_presupuestarias")
        .update({
          codigo: optionalValue(values, "codigo"),
          descripcion: requiredValue(values, "descripcion"),
        })
        .eq("id_udo", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("udos_presupuestarias", id, active);
    },
  },
  {
    key: "secretarias",
    title: "Secretarías",
    group: "estructura",
    fields: [
      { key: "nombre", label: "Nombre", required: true },
      {
        key: "id_udo",
        label: "UDO presupuestaria",
        required: true,
        optionsFrom: "udos_presupuestarias",
      },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("secretarias")
        .select("id_secretaria,nombre,id_udo,estado")
        .order("nombre");
      assertNoError(error);
      const udos = await definitionsByKey.udos_presupuestarias.list();
      return (data ?? []).map((row) => ({
        id: row.id_secretaria,
        label: row.nombre,
        detail: udos.find((udo) => udo.id === row.id_udo)?.label ?? "UDO no disponible",
        active: row.estado,
        values: { nombre: row.nombre, id_udo: String(row.id_udo) },
      }));
    },
    create: async (values) => {
      const { error } = await supabase
        .from("secretarias")
        .insert({ nombre: requiredValue(values, "nombre"), id_udo: foreignKey(values, "id_udo") });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("secretarias")
        .update({ nombre: requiredValue(values, "nombre"), id_udo: foreignKey(values, "id_udo") })
        .eq("id_secretaria", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("secretarias", id, active);
    },
  },
  {
    key: "direcciones",
    title: "Direcciones",
    group: "estructura",
    fields: [
      { key: "nombre", label: "Nombre", required: true },
      { key: "id_secretaria", label: "Secretaría", required: true, optionsFrom: "secretarias" },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("direcciones")
        .select("id_direccion,nombre,id_secretaria,estado")
        .order("nombre");
      assertNoError(error);
      const secretarias = await definitionsByKey.secretarias.list();
      return (data ?? []).map((row) => ({
        id: row.id_direccion,
        label: row.nombre,
        detail:
          secretarias.find((item) => item.id === row.id_secretaria)?.label ??
          "Secretaría no disponible",
        active: row.estado,
        values: { nombre: row.nombre, id_secretaria: String(row.id_secretaria) },
      }));
    },
    create: async (values) => {
      const { error } = await supabase.from("direcciones").insert({
        nombre: requiredValue(values, "nombre"),
        id_secretaria: foreignKey(values, "id_secretaria"),
      });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("direcciones")
        .update({
          nombre: requiredValue(values, "nombre"),
          id_secretaria: foreignKey(values, "id_secretaria"),
        })
        .eq("id_direccion", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("direcciones", id, active);
    },
  },
  {
    key: "unidades_organizativas",
    title: "Unidades organizativas",
    group: "estructura",
    fields: [
      { key: "nombre", label: "Nombre", required: true },
      { key: "tipo", label: "Tipo", required: true, choices: unidadTipos },
      { key: "id_direccion", label: "Dirección", required: true, optionsFrom: "direcciones" },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("unidades_organizativas")
        .select("id_unidad,nombre,tipo,id_direccion,estado")
        .order("nombre");
      assertNoError(error);
      const direcciones = await definitionsByKey.direcciones.list();
      return (data ?? []).map((row) => ({
        id: row.id_unidad,
        label: row.nombre,
        detail: `${row.tipo} · ${direcciones.find((item) => item.id === row.id_direccion)?.label ?? "Dirección no disponible"}`,
        active: row.estado,
        values: { nombre: row.nombre, tipo: row.tipo, id_direccion: String(row.id_direccion) },
      }));
    },
    create: async (values) => {
      const { error } = await supabase.from("unidades_organizativas").insert({
        nombre: requiredValue(values, "nombre"),
        tipo: requiredValue(values, "tipo"),
        id_direccion: foreignKey(values, "id_direccion"),
      });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("unidades_organizativas")
        .update({
          nombre: requiredValue(values, "nombre"),
          tipo: requiredValue(values, "tipo"),
          id_direccion: foreignKey(values, "id_direccion"),
        })
        .eq("id_unidad", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("unidades_organizativas", id, active);
    },
  },
  {
    key: "sectores",
    title: "Sectores",
    group: "estructura",
    fields: [
      { key: "nombre", label: "Nombre", required: true },
      {
        key: "id_unidad",
        label: "Unidad organizativa",
        required: true,
        optionsFrom: "unidades_organizativas",
      },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("sectores")
        .select("id_sector,nombre,id_unidad,estado")
        .order("nombre");
      assertNoError(error);
      const unidades = await definitionsByKey.unidades_organizativas.list();
      return (data ?? []).map((row) => ({
        id: row.id_sector,
        label: row.nombre,
        detail: unidades.find((item) => item.id === row.id_unidad)?.label ?? "Unidad no disponible",
        active: row.estado,
        values: { nombre: row.nombre, id_unidad: String(row.id_unidad) },
      }));
    },
    create: async (values) => {
      const { error } = await supabase.from("sectores").insert({
        nombre: requiredValue(values, "nombre"),
        id_unidad: foreignKey(values, "id_unidad"),
      });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("sectores")
        .update({
          nombre: requiredValue(values, "nombre"),
          id_unidad: foreignKey(values, "id_unidad"),
        })
        .eq("id_sector", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("sectores", id, active);
    },
  },
  {
    key: "relaciones_laborales",
    title: "Relaciones laborales",
    group: "catalogos",
    fields: [{ key: "descripcion", label: "Descripción", required: true }],
    list: async () => {
      const { data, error } = await supabase
        .from("relaciones_laborales")
        .select("id_relacion_laboral,descripcion,estado")
        .order("descripcion");
      assertNoError(error);
      return (data ?? []).map((row) => ({
        id: row.id_relacion_laboral,
        label: row.descripcion,
        detail: "",
        active: row.estado,
        values: { descripcion: row.descripcion },
      }));
    },
    create: async (values) => {
      const { error } = await supabase
        .from("relaciones_laborales")
        .insert({ descripcion: requiredValue(values, "descripcion") });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("relaciones_laborales")
        .update({ descripcion: requiredValue(values, "descripcion") })
        .eq("id_relacion_laboral", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("relaciones_laborales", id, active);
    },
  },
  {
    key: "escalafones",
    title: "Escalafones",
    group: "catalogos",
    fields: [{ key: "descripcion", label: "Descripción", required: true }],
    list: async () => {
      const { data, error } = await supabase
        .from("escalafones")
        .select("id_escalafon,descripcion,estado")
        .order("descripcion");
      assertNoError(error);
      return (data ?? []).map((row) => ({
        id: row.id_escalafon,
        label: row.descripcion,
        detail: "",
        active: row.estado,
        values: { descripcion: row.descripcion },
      }));
    },
    create: async (values) => {
      const { error } = await supabase
        .from("escalafones")
        .insert({ descripcion: requiredValue(values, "descripcion") });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("escalafones")
        .update({ descripcion: requiredValue(values, "descripcion") })
        .eq("id_escalafon", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("escalafones", id, active);
    },
  },
  {
    key: "categorias",
    title: "Categorías",
    group: "catalogos",
    fields: [
      { key: "descripcion", label: "Descripción", required: true },
      { key: "id_escalafon", label: "Escalafón", optionsFrom: "escalafones" },
    ],
    list: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("id_categoria,descripcion,id_escalafon,estado")
        .order("descripcion");
      assertNoError(error);
      const escalafones = await definitionsByKey.escalafones.list();
      return (data ?? []).map((row) => ({
        id: row.id_categoria,
        label: row.descripcion,
        detail: row.id_escalafon
          ? (escalafones.find((item) => item.id === row.id_escalafon)?.label ?? "")
          : "",
        active: row.estado,
        values: {
          descripcion: row.descripcion,
          id_escalafon: row.id_escalafon ? String(row.id_escalafon) : "",
        },
      }));
    },
    create: async (values) => {
      const { error } = await supabase.from("categorias").insert({
        descripcion: requiredValue(values, "descripcion"),
        id_escalafon: optionalForeignKey(values, "id_escalafon"),
      });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("categorias")
        .update({
          descripcion: requiredValue(values, "descripcion"),
          id_escalafon: optionalForeignKey(values, "id_escalafon"),
        })
        .eq("id_categoria", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("categorias", id, active);
    },
  },
  {
    key: "agrupamientos",
    title: "Agrupamientos",
    group: "catalogos",
    fields: [{ key: "descripcion", label: "Descripción", required: true }],
    list: async () => {
      const { data, error } = await supabase
        .from("agrupamientos")
        .select("id_agrupamiento,descripcion,estado")
        .order("descripcion");
      assertNoError(error);
      return (data ?? []).map((row) => ({
        id: row.id_agrupamiento,
        label: row.descripcion,
        detail: "",
        active: row.estado,
        values: { descripcion: row.descripcion },
      }));
    },
    create: async (values) => {
      const { error } = await supabase
        .from("agrupamientos")
        .insert({ descripcion: requiredValue(values, "descripcion") });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("agrupamientos")
        .update({ descripcion: requiredValue(values, "descripcion") })
        .eq("id_agrupamiento", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("agrupamientos", id, active);
    },
  },
  {
    key: "funciones",
    title: "Funciones",
    group: "catalogos",
    fields: [{ key: "descripcion", label: "Descripción", required: true }],
    list: async () => {
      const { data, error } = await supabase
        .from("funciones")
        .select("id_funcion,descripcion,estado")
        .order("descripcion");
      assertNoError(error);
      return (data ?? []).map((row) => ({
        id: row.id_funcion,
        label: row.descripcion,
        detail: "",
        active: row.estado,
        values: { descripcion: row.descripcion },
      }));
    },
    create: async (values) => {
      const { error } = await supabase
        .from("funciones")
        .insert({ descripcion: requiredValue(values, "descripcion") });
      assertNoError(error);
    },
    update: async (id, values) => {
      const { error } = await supabase
        .from("funciones")
        .update({ descripcion: requiredValue(values, "descripcion") })
        .eq("id_funcion", id);
      assertNoError(error);
    },
    setActive: async (id, active) => {
      await applyState("funciones", id, active);
    },
  },
];

const definitionsByKey = Object.fromEntries(
  definitions.map((definition) => [definition.key, definition]),
) as Record<CatalogKey, CatalogDefinition>;
function CatalogosAdmin() {
  const queryClient = useQueryClient();
  const [group, setGroup] = useState<"estructura" | "catalogos">("estructura");
  const [selectedKey, setSelectedKey] = useState<CatalogKey>("udos_presupuestarias");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    key: CatalogKey;
    title: string;
    item: CatalogItem;
  } | null>(null);

  const {
    data: rows,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin-catalogos"],
    queryFn: async () => {
      const entries = await Promise.all(
        definitions.map(async (definition) => [definition.key, await definition.list()] as const),
      );
      return Object.fromEntries(entries) as CatalogRows;
    },
  });

  const selected = definitionsByKey[selectedKey];
  const visibleDefinitions = definitions.filter((definition) => definition.group === group);
  const items = rows?.[selectedKey] ?? [];
  const references = rows ?? {};

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) await selected.update(editing.id, formValues);
      else await selected.create(formValues);
    },
    onSuccess: async () => {
      toast.success(editing ? "Cambios guardados" : "Registro agregado");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-catalogos"] });
    },
    onError: (saveError: Error) =>
      toast.error(saveError.message || "No se pudo guardar el registro"),
  });

  const stateMutationResult = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      if (!selected.setActive) throw new Error("Este catálogo no permite cambiar el estado.");
      await selected.setActive(id, active);
    },
    onSuccess: async () => {
      toast.success("Estado actualizado");
      await queryClient.invalidateQueries({ queryKey: ["admin-catalogos"] });
    },
    onError: (stateError: Error) =>
      toast.error(stateError.message || "No se pudo actualizar el estado"),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ key, id }: { key: CatalogKey; id: number }) => {
      await removeCatalogItem(key, id);
    },
    onSuccess: async () => {
      toast.success("Elemento eliminado");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-catalogos"] });
    },
    onError: (removeError: Error) =>
      toast.error(removeError.message || "No se pudo eliminar el elemento"),
  });

  function chooseGroup(nextGroup: "estructura" | "catalogos") {
    setGroup(nextGroup);
    setSelectedKey(
      definitions.find((definition) => definition.group === nextGroup)?.key ??
        "udos_presupuestarias",
    );
  }

  function openForm(item?: CatalogItem) {
    setEditing(item ?? null);
    const values: Record<string, string> = {};
    for (const field of selected.fields) values[field.key] = "";
    if (item?.values) {
      Object.assign(values, item.values);
    } else if (item) {
      values[selected.fields.at(-1)?.key ?? "descripcion"] = item.label;
    }
    setFormValues(values);
    setDialogOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.8} />
            Administración
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Datos maestros</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Gestioná la estructura organizativa y los catálogos utilizados por la planilla. Personas,
            legajos e historia laboral no se administran desde este panel.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => setImportOpen(true)}
        >
          <FileUp className="h-4 w-4" /> Importar personal
        </Button>
      </div>
      <ImportarPersonalDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          void queryClient.invalidateQueries({ queryKey: ["planilla"] });
        }}
      />

      <Tabs
        value={group}
        onValueChange={(value) => chooseGroup(value as "estructura" | "catalogos")}
      >
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="estructura">Estructura organizativa</TabsTrigger>
          <TabsTrigger value="catalogos">Otros catálogos</TabsTrigger>
        </TabsList>
        <TabsContent value={group}>
          <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <Card className="h-fit lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Datos a gestionar</CardTitle>
                <CardDescription>Seleccioná un grupo de datos.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1.5">
                {visibleDefinitions.map((definition) => (
                  <Button
                    key={definition.key}
                    variant="ghost"
                    className={
                      "justify-start rounded-xl px-3 " +
                      (selectedKey === definition.key
                        ? "bg-primary/10 font-bold text-primary hover:bg-primary/15"
                        : "text-muted-foreground")
                    }
                    onClick={() => setSelectedKey(definition.key)}
                  >
                    {definition.title}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">{selected.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {items.length} {items.length === 1 ? "registro" : "registros"} · Los datos
                    existentes se conservan al desactivar un elemento.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Actualizar datos"
                    onClick={() => void refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => openForm()}>
                    <Plus className="h-4 w-4" /> Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Cargando datos…</p>
                ) : error ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">No se pudieron cargar los catálogos.</p>
                      <p className="mt-1 text-muted-foreground">{error.message}</p>
                    </div>
                  </div>
                ) : items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay registros en este catálogo.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="group flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-primary/[0.04]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{item.label}</p>
                          {item.detail && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.detail}
                            </p>
                          )}
                          {item.active !== null && (
                            <span
                              className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                                item.active
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "border-border bg-muted text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${item.active ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                              />
                              {item.active ? "Activo" : "Inactivo"}
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            aria-label={`Editar ${item.label}`}
                            onClick={() => openForm(item)}
                          >
                            <SquarePen className="h-4 w-4" />
                          </Button>
                          {selected.setActive && item.active !== null && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={
                                item.active
                                  ? "h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                                  : "h-8 w-8 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                              }
                              aria-label={`${item.active ? "Desactivar" : "Activar"} ${item.label}`}
                              disabled={stateMutationResult.isPending}
                              onClick={() =>
                                stateMutationResult.mutate({ id: item.id, active: !item.active })
                              }
                            >
                              {item.active ? (
                                <CircleCheck className="h-4 w-4" />
                              ) : (
                                <CircleX className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Eliminar ${item.label}`}
                            disabled={removeMutation.isPending}
                            onClick={() =>
                              setDeleteTarget({ key: selectedKey, title: selected.title, item })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !removeMutation.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro que deseas eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{deleteTarget?.item.label}” de {deleteTarget?.title}. Esta acción no se
              puede deshacer. Si el elemento está siendo utilizado por otros registros, la base de
              datos impedirá eliminarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (deleteTarget) {
                  removeMutation.mutate({ key: deleteTarget.key, id: deleteTarget.item.id });
                }
              }}
            >
              {removeMutation.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? `Editar ${selected.title.toLowerCase()}`
                : `Agregar ${selected.title.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {selected.fields.map((field) => {
              const options = field.optionsFrom ? (references[field.optionsFrom] ?? []) : [];
              const choices = field.choices ?? noOptions;
              return (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={`catalog-${field.key}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  {field.optionsFrom || choices.length > 0 ? (
                    <select
                      id={`catalog-${field.key}`}
                      required={field.required}
                      value={formValues[field.key] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-xl border border-input bg-card/80 px-3.5 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <option value="">Seleccioná una opción</option>
                      {field.optionsFrom
                        ? options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))
                        : choices.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                              {choice.label}
                            </option>
                          ))}
                    </select>
                  ) : (
                    <Input
                      id={`catalog-${field.key}`}
                      value={formValues[field.key] ?? ""}
                      required={field.required}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              );
            })}
            <DialogFooter className="border-t border-border/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando…" : editing ? "Guardar cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { CatalogosAdmin };
