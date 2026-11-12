import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
import {
  AlertCircle,
  BarChart3,
  Building2,
  LayoutGrid,
  RefreshCw,
  SlidersHorizontal,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
<<<<<<< HEAD
=======
import { BarChart3, RefreshCw, UsersRound } from "lucide-react";
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 1000;
const UNASSIGNED = "unassigned";
const CHART_COLORS = [
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#3b82f6",
] as const;
<<<<<<< HEAD
const CHART_CONFIG = {
  count: { label: "Registros", color: CHART_COLORS[0] },
} satisfies ChartConfig;
const MAX_CHART_BARS = 8;
const AGE_GROUPS = [
  "Menos de 25",
  "25 a 34",
  "35 a 44",
  "45 a 54",
  "55 o más",
  "Sin fecha válida",
] as const;
=======
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
const CHART_CONFIG = {
  count: { label: "Registros", color: CHART_COLORS[0] },
} satisfies ChartConfig;
const MAX_CHART_BARS = 8;
<<<<<<< HEAD
>>>>>>> c07c827 (dashbord e interfaz)
=======
const AGE_GROUPS = [
  "Menos de 25",
  "25 a 34",
  "35 a 44",
  "45 a 54",
  "55 o más",
  "Sin fecha válida",
] as const;
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)

type DashboardFilters = {
  udo: string;
  secretaria: string;
  direccion: string;
  sector: string;
};

type DistributionItem = {
  id: string;
  label: string;
  count: number;
};

type DashboardRecord = {
  id_sector: number | null;
  id_funcion: number | null;
  id_relacion_laboral: number | null;
  sexo: string | null;
<<<<<<< HEAD
<<<<<<< HEAD
  fecha_nacimiento: string | null;
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
  fecha_nacimiento: string | null;
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
};

type DashboardDistributions = [
  DistributionItem[],
  DistributionItem[],
  DistributionItem[],
  DistributionItem[],
  DistributionItem[],
  DistributionItem[],
  DistributionItem[],
<<<<<<< HEAD
<<<<<<< HEAD
  DistributionItem[],
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
  DistributionItem[],
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
];

async function loadAllPages<T>(
  loadPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function loadDashboardData() {
  const [
    records,
    people,
    udos,
    secretarias,
    direcciones,
    unidades,
    sectores,
    funciones,
    relaciones,
  ] = await Promise.all([
    loadAllPages((from, to) =>
      supabase
        .from("legajo")
        .select("id_persona,id_sector,id_funcion,id_relacion_laboral")
        .order("id_legajo")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
      supabase
        .from("personas")
        .select("id_persona,sexo,fecha_nacimiento")
        .order("id_persona")
        .range(from, to),
<<<<<<< HEAD
=======
      supabase.from("personas").select("id_persona,sexo").order("id_persona").range(from, to),
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
    ),
    loadAllPages((from, to) =>
      supabase
        .from("udos_presupuestarias")
        .select("id_udo,descripcion")
        .order("id_udo")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("secretarias")
        .select("id_secretaria,nombre,id_udo")
        .order("id_secretaria")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("direcciones")
        .select("id_direccion,nombre,id_secretaria")
        .order("id_direccion")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("unidades_organizativas")
        .select("id_unidad,id_direccion")
        .order("id_unidad")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("sectores")
        .select("id_sector,nombre,id_unidad")
        .order("id_sector")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("funciones")
        .select("id_funcion,descripcion")
        .order("id_funcion")
        .range(from, to),
    ),
    loadAllPages((from, to) =>
      supabase
        .from("relaciones_laborales")
        .select("id_relacion_laboral,descripcion")
        .order("id_relacion_laboral")
        .range(from, to),
    ),
  ]);

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
  const personById = new Map(
    people.map((person) => [
      person.id_persona,
      { sexo: person.sexo, fecha_nacimiento: person.fecha_nacimiento },
    ]),
  );
<<<<<<< HEAD
=======
  const sexByPerson = new Map(people.map((person) => [person.id_persona, person.sexo]));
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
  const udoById = new Map(udos.map((item) => [item.id_udo, item.descripcion]));
  const secretariaById = new Map(secretarias.map((item) => [item.id_secretaria, item]));
  const direccionById = new Map(direcciones.map((item) => [item.id_direccion, item]));
  const unidadById = new Map(unidades.map((item) => [item.id_unidad, item]));
  const sectorById = new Map(sectores.map((item) => [item.id_sector, item]));
  const funcionById = new Map(funciones.map((item) => [item.id_funcion, item.descripcion]));
  const relacionById = new Map(
    relaciones.map((item) => [item.id_relacion_laboral, item.descripcion]),
  );

  return {
    records: records.map((record): DashboardRecord => ({
      id_sector: record.id_sector,
      id_funcion: record.id_funcion,
      id_relacion_laboral: record.id_relacion_laboral,
<<<<<<< HEAD
<<<<<<< HEAD
      sexo: personById.get(record.id_persona)?.sexo ?? null,
      fecha_nacimiento: personById.get(record.id_persona)?.fecha_nacimiento ?? null,
=======
      sexo: sexByPerson.get(record.id_persona) ?? null,
>>>>>>> c07c827 (dashbord e interfaz)
=======
      sexo: personById.get(record.id_persona)?.sexo ?? null,
      fecha_nacimiento: personById.get(record.id_persona)?.fecha_nacimiento ?? null,
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
    })),
    people,
    udos,
    secretarias,
    direcciones,
    unidades,
    sectores,
    funciones,
    relaciones,
    lookups: {
      udoById,
      secretariaById,
      direccionById,
      unidadById,
      sectorById,
      funcionById,
      relacionById,
    },
  };
}

function distribution(
  records: DashboardRecord[],
  getId: (record: DashboardRecord) => number | null,
  labels: Map<number, string>,
): DistributionItem[] {
  const counts = new Map<string, DistributionItem>();
  for (const record of records) {
    const id = getId(record);
    const key = id === null ? UNASSIGNED : String(id);
    const current = counts.get(key);
    if (current) {
      current.count += 1;
    } else {
      counts.set(key, {
        id: key,
        label: id === null ? "Sin asignar" : (labels.get(id) ?? "Sin asignar"),
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
function ageGroup(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "Sin fecha válida";

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth);
  if (!match) return "Sin fecha válida";
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const birthday = new Date(Date.UTC(year, month - 1, day));
  if (
    birthday.getUTCFullYear() !== year ||
    birthday.getUTCMonth() !== month - 1 ||
    birthday.getUTCDate() !== day
  ) {
    return "Sin fecha válida";
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    age -= 1;
  }
  if (age < 0) return "Sin fecha válida";
  if (age < 25) return AGE_GROUPS[0];
  if (age < 35) return AGE_GROUPS[1];
  if (age < 45) return AGE_GROUPS[2];
  if (age < 55) return AGE_GROUPS[3];
  return AGE_GROUPS[4];
}

<<<<<<< HEAD
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
function useDashboardData() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: loadDashboardData,
<<<<<<< HEAD
<<<<<<< HEAD
    refetchInterval: 30000,
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
    refetchInterval: 30000,
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
  });
}

function DistributionCard({
  title,
  description,
  items,
  total,
  chartType = "bar",
}: {
  title: string;
  description: string;
  items: DistributionItem[];
  total: number;
  chartType?: "bar" | "donut";
}) {
  const chartItems = useMemo(() => {
    if (chartType === "donut" || items.length <= MAX_CHART_BARS) return items;
    const topItems = items.slice(0, MAX_CHART_BARS - 1);
    const otherCount = items.slice(MAX_CHART_BARS - 1).reduce((sum, item) => sum + item.count, 0);
    return [...topItems, { id: "other", label: "Otros", count: otherCount }];
  }, [chartType, items]);

  return (
    <Card>
<<<<<<< HEAD
<<<<<<< HEAD
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
=======
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
>>>>>>> c07c827 (dashbord e interfaz)
=======
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold tracking-tight">{title}</CardTitle>
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros en este ámbito.</p>
        ) : chartType === "donut" ? (
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(130px,0.8fr)]">
            <div className="relative">
              <ChartContainer
                config={CHART_CONFIG}
                className="mx-auto h-[220px] w-full max-w-[260px] aspect-auto"
                role="img"
                aria-label={`${title}: ${items.map((item) => `${item.label} ${item.count}`).join(", ")}`}
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => value}
                        formatter={(value) => (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {Number(value).toLocaleString("es-AR")} registros
                          </span>
                        )}
                      />
                    }
                  />
                  <Pie
                    data={items}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {items.map((item, index) => (
                      <Cell key={item.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">
                  {items.reduce((sum, item) => sum + item.count, 0).toLocaleString("es-AR")}
                </span>
                <span className="text-xs text-muted-foreground">registros</span>
              </div>
            </div>
            <ul className="grid gap-3">
              {items.map((item, index) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {item.count.toLocaleString("es-AR")}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({total ? Math.round((item.count / total) * 100) : 0}%)
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <ChartContainer
              config={CHART_CONFIG}
              className="h-[280px] w-full aspect-auto"
              role="img"
              aria-label={`${title}: ${chartItems
                .map((item) => `${item.label} ${item.count}`)
                .join(", ")}`}
            >
              <BarChart
                data={chartItems}
<<<<<<< HEAD
<<<<<<< HEAD
                margin={{ top: 20, right: 12, bottom: 4, left: 0 }}
                barCategoryGap={10}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={72}
                  tickFormatter={(value: string) =>
                    value.length > 14 ? `${value.slice(0, 13)}…` : value
                  }
                />
                <YAxis
=======
                layout="vertical"
                margin={{ top: 4, right: 28, bottom: 4, left: 4 }}
=======
                margin={{ top: 20, right: 12, bottom: 4, left: 0 }}
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
                barCategoryGap={10}
              >
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
<<<<<<< HEAD
>>>>>>> c07c827 (dashbord e interfaz)
=======
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={72}
                  tickFormatter={(value: string) =>
                    value.length > 14 ? `${value.slice(0, 13)}…` : value
                  }
                />
                <YAxis
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  tickFormatter={(value: number) => value.toLocaleString("es-AR")}
                />
<<<<<<< HEAD
<<<<<<< HEAD
=======
                <YAxis
                  type="category"
                  dataKey="label"
                  width={112}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  tickFormatter={(value: string) =>
                    value.length > 17 ? `${value.slice(0, 16)}…` : value
                  }
                />
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.55 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value}
                      formatter={(value) => (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toLocaleString("es-AR")} registros
                        </span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
<<<<<<< HEAD
<<<<<<< HEAD
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
                  isAnimationActive
                >
                  {chartItems.map((item, index) => (
                    <Cell key={item.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
=======
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
=======
                  radius={[6, 6, 0, 0]}
                  maxBarSize={38}
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
                  isAnimationActive
                >
                  {chartItems.map((item, index) => (
                    <Cell key={item.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="count"
<<<<<<< HEAD
                    position="right"
>>>>>>> c07c827 (dashbord e interfaz)
=======
                    position="top"
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
                    className="fill-foreground text-xs"
                    formatter={(value: number) => value.toLocaleString("es-AR")}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
            <ul className="mt-4 grid max-h-36 grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto border-t pt-3 text-xs sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.id} className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground">{item.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {item.count.toLocaleString("es-AR")} ·{" "}
                    {total ? Math.round((item.count / total) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { id: number; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
<<<<<<< HEAD
<<<<<<< HEAD
        className="h-11 w-full rounded-xl border border-input bg-card/80 px-3.5 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
=======
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
>>>>>>> c07c827 (dashbord e interfaz)
=======
        className="h-11 w-full rounded-xl border border-input bg-card/80 px-3.5 text-sm shadow-sm transition-colors hover:border-primary/35 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <CardContent className="relative flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight tabular-nums">
            {value.toLocaleString("es-AR")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className={"grid h-11 w-11 shrink-0 place-items-center rounded-2xl " + tone}>
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
      </CardContent>
    </Card>
  );
}

<<<<<<< HEAD
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
export function AdminDashboard() {
  const dashboard = useDashboardData();
  const [filters, setFilters] = useState<DashboardFilters>({
    udo: "",
    secretaria: "",
    direccion: "",
    sector: "",
  });
  const data = dashboard.data;

  const options = useMemo(() => {
    if (!data) return { secretarias: [], direcciones: [], sectores: [] };
    const udoId = filters.udo ? Number(filters.udo) : null;
    const secretariaId = filters.secretaria ? Number(filters.secretaria) : null;
    const direccionId = filters.direccion ? Number(filters.direccion) : null;

    const secretarias = data.secretarias
      .filter((item) => udoId === null || item.id_udo === udoId)
      .map((item) => ({ id: item.id_secretaria, label: item.nombre }));
    const direcciones = data.direcciones
      .filter((item) => secretariaId === null || item.id_secretaria === secretariaId)
      .map((item) => ({ id: item.id_direccion, label: item.nombre }));
    const directionIds = new Set(
      data.direcciones
        .filter(
          (item) =>
            (secretariaId === null || item.id_secretaria === secretariaId) &&
            (direccionId === null || item.id_direccion === direccionId),
        )
        .map((item) => item.id_direccion),
    );
    const unitIds = new Set(
      data.unidades
        .filter((item) => directionIds.has(item.id_direccion))
        .map((item) => item.id_unidad),
    );
    const sectores = data.sectores
      .filter((item) => unitIds.has(item.id_unidad))
      .map((item) => ({ id: item.id_sector, label: item.nombre }));
    return { secretarias, direcciones, sectores };
  }, [data, filters.udo, filters.secretaria, filters.direccion]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    const udoId = filters.udo ? Number(filters.udo) : null;
    const secretariaId = filters.secretaria ? Number(filters.secretaria) : null;
    const direccionId = filters.direccion ? Number(filters.direccion) : null;
    const sectorId = filters.sector ? Number(filters.sector) : null;

    return data.records.filter((record) => {
      if (sectorId !== null && record.id_sector !== sectorId) return false;
      if (record.id_sector === null)
        return udoId === null && secretariaId === null && direccionId === null;

      const sector = data.lookups.sectorById.get(record.id_sector);
      const unit = sector ? data.lookups.unidadById.get(sector.id_unidad) : null;
      const direccion = unit ? data.lookups.direccionById.get(unit.id_direccion) : null;
      const secretaria = direccion
        ? data.lookups.secretariaById.get(direccion.id_secretaria)
        : null;
      if (udoId !== null && secretaria?.id_udo !== udoId) return false;
      if (secretariaId !== null && direccion?.id_secretaria !== secretariaId) return false;
      if (direccionId !== null && unit?.id_direccion !== direccionId) return false;
      return true;
    });
  }, [data, filters]);

  const distributions = useMemo(() => {
    if (!data) return null;
    const lookup = data.lookups;
    const bySex = new Map<string, DistributionItem>();
<<<<<<< HEAD
<<<<<<< HEAD
    const byAge = new Map<string, DistributionItem>();
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
    const byAge = new Map<string, DistributionItem>();
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
    for (const record of filteredRecords) {
      const normalized = (record.sexo ?? "").trim().toLocaleUpperCase("es-AR");
      const label =
        normalized === "MASCULINO" || normalized === "MASCULINA" || normalized === "HOMBRE"
          ? "Masculino"
          : normalized === "FEMENINO" || normalized === "FEMENINA" || normalized === "MUJER"
            ? "Femenino"
            : "Sin especificar / otro";
      const current = bySex.get(label);
      if (current) current.count += 1;
      else bySex.set(label, { id: label, label, count: 1 });
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)

      const ageLabel = ageGroup(record.fecha_nacimiento);
      const age = byAge.get(ageLabel);
      if (age) age.count += 1;
      else byAge.set(ageLabel, { id: ageLabel, label: ageLabel, count: 1 });
<<<<<<< HEAD
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
    }

    const result: DashboardDistributions = [
      distribution(
        filteredRecords,
        (record) => {
          if (record.id_sector === null) return null;
          const sector = lookup.sectorById.get(record.id_sector);
          const unit = sector ? lookup.unidadById.get(sector.id_unidad) : null;
          const direccion = unit ? lookup.direccionById.get(unit.id_direccion) : null;
          const secretaria = direccion ? lookup.secretariaById.get(direccion.id_secretaria) : null;
          return secretaria?.id_udo ?? null;
        },
        lookup.udoById,
      ),
      distribution(
        filteredRecords,
        (record) => {
          if (record.id_sector === null) return null;
          const sector = lookup.sectorById.get(record.id_sector);
          const unit = sector ? lookup.unidadById.get(sector.id_unidad) : null;
          const direccion = unit ? lookup.direccionById.get(unit.id_direccion) : null;
          return direccion?.id_secretaria ?? null;
        },
        new Map(data.secretarias.map((item) => [item.id_secretaria, item.nombre])),
      ),
      distribution(
        filteredRecords,
        (record) => {
          if (record.id_sector === null) return null;
          const sector = lookup.sectorById.get(record.id_sector);
          const unit = sector ? lookup.unidadById.get(sector.id_unidad) : null;
          return unit?.id_direccion ?? null;
        },
        new Map(data.direcciones.map((item) => [item.id_direccion, item.nombre])),
      ),
      distribution(
        filteredRecords,
        (record) => record.id_sector,
        new Map(data.sectores.map((item) => [item.id_sector, item.nombre])),
      ),
      distribution(filteredRecords, (record) => record.id_funcion, lookup.funcionById),
      distribution(filteredRecords, (record) => record.id_relacion_laboral, lookup.relacionById),
      [...bySex.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
      AGE_GROUPS.flatMap((label) => {
        const item = byAge.get(label);
        return item ? [item] : [];
      }),
<<<<<<< HEAD
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
    ];
    return result;
  }, [data, filteredRecords]);

  function updateFilter(key: keyof DashboardFilters, value: string) {
    setFilters((current) => {
      if (key === "udo") return { udo: value, secretaria: "", direccion: "", sector: "" };
      if (key === "secretaria") return { ...current, secretaria: value, direccion: "", sector: "" };
      if (key === "direccion") return { ...current, direccion: value, sector: "" };
      return { ...current, sector: value };
    });
  }

  const total = filteredRecords.length;
<<<<<<< HEAD
<<<<<<< HEAD
  const udoCount = distributions?.[0].filter((item) => item.id !== UNASSIGNED).length ?? 0;
  const sectorCount = distributions?.[3].filter((item) => item.id !== UNASSIGNED).length ?? 0;
  const unassignedSectors = distributions?.[3].find((item) => item.id === UNASSIGNED)?.count ?? 0;

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.8} />
            Administración
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dashboard de personal
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
=======
=======
  const udoCount = distributions?.[0].filter((item) => item.id !== UNASSIGNED).length ?? 0;
  const sectorCount = distributions?.[3].filter((item) => item.id !== UNASSIGNED).length ?? 0;
  const unassignedSectors = distributions?.[3].find((item) => item.id === UNASSIGNED)?.count ?? 0;
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.8} />
            Administración
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Dashboard de personal
          </h1>
<<<<<<< HEAD
          <p className="mt-1.5 text-sm text-muted-foreground">
>>>>>>> c07c827 (dashbord e interfaz)
=======
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
            Distribución global o por estructura organizativa.
          </p>
        </div>
        <Button
          variant="outline"
<<<<<<< HEAD
<<<<<<< HEAD
          className="w-full shrink-0 sm:w-auto"
          onClick={() => void dashboard.refetch()}
          disabled={dashboard.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />
=======
          onClick={() => void dashboard.refetch()}
          disabled={dashboard.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />
>>>>>>> c07c827 (dashbord e interfaz)
=======
          className="w-full shrink-0 sm:w-auto"
          onClick={() => void dashboard.refetch()}
          disabled={dashboard.isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`} />
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <SlidersHorizontal className="h-4 w-4 text-primary" strokeWidth={1.8} />
            Ámbito del informe
          </CardTitle>
<<<<<<< HEAD
=======
          <CardTitle className="text-base">Ámbito del informe</CardTitle>
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          <CardDescription>
            Dejá los filtros en “Todas” para ver el total global. Los niveles se filtran en orden.
          </CardDescription>
        </CardHeader>
<<<<<<< HEAD
<<<<<<< HEAD
        <CardContent className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
=======
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
>>>>>>> c07c827 (dashbord e interfaz)
=======
        <CardContent className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          <FilterSelect
            id="dashboard-udo"
            label="UDO"
            value={filters.udo}
            options={(data?.udos ?? []).map((item) => ({
              id: item.id_udo,
              label: item.descripcion,
            }))}
            onChange={(value) => updateFilter("udo", value)}
          />
          <FilterSelect
            id="dashboard-secretaria"
            label="Secretaría"
            value={filters.secretaria}
            options={options.secretarias}
            disabled={!filters.udo}
            onChange={(value) => updateFilter("secretaria", value)}
          />
          <FilterSelect
            id="dashboard-direccion"
            label="Dirección"
            value={filters.direccion}
            options={options.direcciones}
            disabled={!filters.secretaria}
            onChange={(value) => updateFilter("direccion", value)}
          />
          <FilterSelect
            id="dashboard-sector"
            label="Sector"
            value={filters.sector}
            options={options.sectores}
            disabled={!filters.direccion}
            onChange={(value) => updateFilter("sector", value)}
          />
        </CardContent>
      </Card>

      {dashboard.isPending ? (
        <Card>
<<<<<<< HEAD
<<<<<<< HEAD
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
=======
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
>>>>>>> c07c827 (dashbord e interfaz)
=======
          <CardContent className="py-14 text-center text-sm text-muted-foreground">
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
            Cargando estadísticas…
          </CardContent>
        </Card>
      ) : dashboard.error ? (
        <Card>
          <CardContent className="py-8">
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">No se pudieron cargar las estadísticas.</p>
                <p className="mt-1 text-muted-foreground">{dashboard.error.message}</p>
              </div>
<<<<<<< HEAD
=======
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">No se pudieron cargar las estadísticas.</p>
              <p className="mt-1 text-muted-foreground">{dashboard.error.message}</p>
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total de legajos"
              value={total}
              hint="En el ámbito seleccionado"
              icon={UsersRound}
              tone="bg-primary/10 text-primary"
            />
            <StatCard
              label="UDO con registros"
              value={udoCount}
              hint="Unidades presupuestarias"
              icon={Building2}
              tone="bg-sky-500/10 text-sky-600 dark:text-sky-400"
            />
            <StatCard
              label="Sectores con registros"
              value={sectorCount}
              hint="Estructura organizativa"
              icon={LayoutGrid}
              tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Sin sector asignado"
              value={unassignedSectors}
              hint="Requieren revisión"
              icon={AlertCircle}
              tone="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>
<<<<<<< HEAD
=======
          <Card>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registros en el ámbito seleccionado</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {total.toLocaleString("es-AR")}
                </p>
              </div>
            </CardContent>
          </Card>
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
          {distributions && (
            <div className="grid gap-4 xl:grid-cols-2">
              <DistributionCard
                title="Registros por UDO"
                description="Unidades de organización presupuestaria"
                items={distributions[0]}
                total={total}
              />
              <DistributionCard
                title="Registros por secretaría"
                description="Secretarías asociadas a los legajos"
                items={distributions[1]}
                total={total}
              />
              <DistributionCard
                title="Registros por dirección"
                description="Direcciones asociadas a los legajos"
                items={distributions[2]}
                total={total}
              />
              <DistributionCard
                title="Registros por sector"
                description="Sectores asociados a los legajos"
                items={distributions[3]}
                total={total}
              />
              <DistributionCard
                title="Registros por función"
                description="Incluye los legajos sin función asignada"
                items={distributions[4]}
                total={total}
              />
              <DistributionCard
                title="Registros por relación laboral"
                description="Incluye los legajos sin relación asignada"
                items={distributions[5]}
                total={total}
              />
              <DistributionCard
                title="Registros por sexo"
                description="Según el dato registrado en la persona"
                items={distributions[6]}
                total={total}
                chartType="donut"
              />
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
              <DistributionCard
                title="Registros por grupo de edad"
                description="Edad calculada a partir de la fecha de nacimiento registrada"
                items={distributions[7]}
                total={total}
              />
<<<<<<< HEAD
=======
>>>>>>> c07c827 (dashbord e interfaz)
=======
>>>>>>> 97bc840 (Modificacion dashboard  y tema oscuro)
            </div>
          )}
        </>
      )}
    </div>
  );
}
