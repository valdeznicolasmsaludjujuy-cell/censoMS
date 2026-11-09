create table public.lugares_trabajo (id_lugar bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());
create table public.adicionales (id_adicional bigint generated always as identity primary key, tipo text not null check (tipo in ('MAYOR_HORARIO','JEFATURA')), descripcion text not null, estado boolean not null default true, created_at timestamptz not null default now(), unique(tipo, descripcion));
create table public.titulos (id_titulo bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());
create table public.opciones (id_opcion bigint generated always as identity primary key, grupo text not null, descripcion text not null, unique(grupo, descripcion));

do $$
declare t text;
begin
  foreach t in array array['lugares_trabajo','adicionales','titulos','opciones'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "leer" on public.%I for select to authenticated using (public.can_read(auth.uid()))', t);
    execute format('create policy "insertar" on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t);
    execute format('create policy "actualizar" on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t);
  end loop;
end $$;

alter table public.legajo
  add column id_udo bigint references public.udos_presupuestarias(id_udo),
  add column id_lugar bigint references public.lugares_trabajo(id_lugar),
  add column id_adic_mayor_horario bigint references public.adicionales(id_adicional),
  add column id_adic_jefatura bigint references public.adicionales(id_adicional),
  add column afectado_tipo text,
  add column validacion text,
  add column observacion text,
  add column dependencia text;
alter table public.personas add column id_titulo bigint references public.titulos(id_titulo);

comment on view public.v_legajos is 'DEPRECATED: replaced by v_planilla';
create view public.v_planilla with (security_invoker = true) as
select l.id_legajo, l.controlado, l.controlado_at,
  p.id_persona, p.apellido_nombre, p.dni, p.cuil,
  u.codigo as udo_codigo, u.descripcion as udo,
  c.descripcion as categoria,
  lt.descripcion as lugar_trabajo,
  l.validacion
from public.legajo l
join public.personas p on p.id_persona = l.id_persona
left join public.udos_presupuestarias u on u.id_udo = l.id_udo
left join public.categorias c on c.id_categoria = l.id_categoria
left join public.lugares_trabajo lt on lt.id_lugar = l.id_lugar;
grant select on public.v_planilla to authenticated;