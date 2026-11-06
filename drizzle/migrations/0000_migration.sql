-- Roles
create type public.app_role as enum ('admin','carga','consulta');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.can_read(_u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _u)
$$;
create or replace function public.can_write(_u uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _u and role in ('admin','carga'))
$$;
create policy "ver propios roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- First user becomes admin, the rest consulta
create or replace function public.handle_new_user_role() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles) then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles(user_id, role) values (new.id, 'consulta');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users for each row execute function public.handle_new_user_role();

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Organizational structure
create table public.udos_presupuestarias (id_udo bigint generated always as identity primary key, codigo text, descripcion text not null, estado boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.secretarias (id_secretaria bigint generated always as identity primary key, id_udo bigint not null references public.udos_presupuestarias(id_udo), nombre text not null, estado boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.unidades_organizativas (id_unidad bigint generated always as identity primary key, id_secretaria bigint not null references public.secretarias(id_secretaria), nombre text not null, tipo text not null check (tipo in ('SUBDIRECCION','COORDINACION')), estado boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.sectores (id_sector bigint generated always as identity primary key, id_unidad bigint not null references public.unidades_organizativas(id_unidad), nombre text not null, estado boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Catalogs
create table public.relaciones_laborales (id_relacion_laboral bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());
create table public.escalafones (id_escalafon bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());
create table public.categorias (id_categoria bigint generated always as identity primary key, id_escalafon bigint references public.escalafones(id_escalafon), codigo text, descripcion text not null, estado boolean not null default true, created_at timestamptz not null default now());
create table public.agrupamientos (id_agrupamiento bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());
create table public.funciones (id_funcion bigint generated always as identity primary key, descripcion text not null unique, estado boolean not null default true, created_at timestamptz not null default now());

-- Personas
create table public.personas (
  id_persona bigint generated always as identity primary key,
  apellido_nombre text not null,
  dni text unique check (dni is null or dni ~ '^\d{7,8}$'),
  cuil text unique check (cuil is null or cuil ~ '^\d{11}$'),
  sexo text, fecha_nacimiento date, titulo text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Legajo
create table public.legajo (
  id_legajo bigint generated always as identity primary key,
  orden integer,
  id_persona bigint not null references public.personas(id_persona),
  id_sector bigint references public.sectores(id_sector),
  id_relacion_laboral bigint references public.relaciones_laborales(id_relacion_laboral),
  id_categoria bigint references public.categorias(id_categoria),
  id_agrupamiento bigint references public.agrupamientos(id_agrupamiento),
  id_funcion bigint references public.funciones(id_funcion),
  adic_mayor_horario numeric(14,2) check (adic_mayor_horario is null or adic_mayor_horario >= 0),
  adic_por_jefatura numeric(14,2) check (adic_por_jefatura is null or adic_por_jefatura >= 0),
  afectado boolean not null default false,
  fecha_desde date, fecha_hasta date,
  controlado boolean not null default false,
  controlado_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (fecha_hasta is null or fecha_desde is null or fecha_hasta >= fecha_desde)
);
create index on public.legajo(controlado, orden);

create table public.historial_laboral (
  id_historial bigint generated always as identity primary key,
  id_legajo bigint not null references public.legajo(id_legajo),
  movimiento text not null,
  fecha_movimiento timestamptz not null default now(),
  datos_anteriores jsonb, datos_nuevos jsonb, observaciones text,
  usuario uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- updated_at triggers
create trigger t_udo before update on public.udos_presupuestarias for each row execute function public.set_updated_at();
create trigger t_sec before update on public.secretarias for each row execute function public.set_updated_at();
create trigger t_uni before update on public.unidades_organizativas for each row execute function public.set_updated_at();
create trigger t_sect before update on public.sectores for each row execute function public.set_updated_at();
create trigger t_per before update on public.personas for each row execute function public.set_updated_at();
create trigger t_leg before update on public.legajo for each row execute function public.set_updated_at();

-- History trigger
create or replace function public.log_legajo() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.historial_laboral(id_legajo, movimiento, datos_nuevos) values (new.id_legajo, 'Alta de legajo', to_jsonb(new));
  elsif to_jsonb(old) - 'updated_at' is distinct from to_jsonb(new) - 'updated_at' then
    insert into public.historial_laboral(id_legajo, movimiento, datos_anteriores, datos_nuevos)
    values (new.id_legajo, case when new.controlado and not old.controlado then 'Control de datos' else 'Modificación de legajo' end, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end $$;
create trigger t_leg_hist after insert or update on public.legajo for each row execute function public.log_legajo();

-- Grants + RLS
do $$
declare t text;
begin
  foreach t in array array['udos_presupuestarias','secretarias','unidades_organizativas','sectores','relaciones_laborales','escalafones','categorias','agrupamientos','funciones','personas','legajo'] loop
    execute format('grant select, insert, update on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "leer" on public.%I for select to authenticated using (public.can_read(auth.uid()))', t);
    execute format('create policy "insertar" on public.%I for insert to authenticated with check (public.can_write(auth.uid()))', t);
    execute format('create policy "actualizar" on public.%I for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()))', t);
  end loop;
end $$;
grant select on public.historial_laboral to authenticated;
grant all on public.historial_laboral to service_role;
alter table public.historial_laboral enable row level security;
create policy "leer historial" on public.historial_laboral for select to authenticated using (public.can_read(auth.uid()));

-- View for the list (respects RLS of the caller)
create view public.v_legajos with (security_invoker = true) as
select l.id_legajo, l.orden, l.controlado, l.controlado_at,
  p.id_persona, p.apellido_nombre, p.dni, p.cuil,
  u.codigo as udo_codigo, u.descripcion as udo,
  c.descripcion as categoria,
  s.nombre as sector, uo.nombre as unidad, se.nombre as secretaria
from public.legajo l
join public.personas p on p.id_persona = l.id_persona
left join public.sectores s on s.id_sector = l.id_sector
left join public.unidades_organizativas uo on uo.id_unidad = s.id_unidad
left join public.secretarias se on se.id_secretaria = uo.id_secretaria
left join public.udos_presupuestarias u on u.id_udo = se.id_udo
left join public.categorias c on c.id_categoria = l.id_categoria;
grant select on public.v_legajos to authenticated;