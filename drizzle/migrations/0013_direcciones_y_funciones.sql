CREATE TABLE public.direcciones (
  id_direccion bigint generated always as identity primary key,
  id_secretaria bigint not null references public.secretarias(id_secretaria),
  nombre text not null,
  estado boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger t_dir before update on public.direcciones for each row execute function public.set_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.direcciones TO authenticated;
GRANT ALL ON public.direcciones TO service_role;
ALTER TABLE public.direcciones ENABLE ROW LEVEL SECURITY;
create policy "leer" on public.direcciones for select to authenticated using (public.can_read(auth.uid()));
create policy "insertar" on public.direcciones for insert to authenticated with check (public.can_write(auth.uid()));
create policy "actualizar" on public.direcciones for update to authenticated using (public.can_write(auth.uid())) with check (public.can_write(auth.uid()));

alter table public.unidades_organizativas add column id_direccion bigint references public.direcciones(id_direccion);

insert into public.direcciones (id_secretaria, nombre)
select distinct uo.id_secretaria, 'Dirección General'
from public.unidades_organizativas uo
where not exists (
  select 1 from public.direcciones d where d.id_secretaria = uo.id_secretaria
);

update public.unidades_organizativas uo
set id_direccion = d.id_direccion
from public.direcciones d
where d.id_secretaria = uo.id_secretaria;

comment on column public.unidades_organizativas.id_secretaria is 'DEPRECATED: replaced by id_direccion';

create or replace view public.v_legajos with (security_invoker = true) as
select l.id_legajo, l.orden, l.controlado, l.controlado_at,
  p.id_persona, p.apellido_nombre, p.dni, p.cuil,
  u.codigo as udo_codigo, u.descripcion as udo,
  c.descripcion as categoria,
  s.nombre as sector, uo.nombre as unidad, se.nombre as secretaria,
  d.nombre as direccion
from public.legajo l
join public.personas p on p.id_persona = l.id_persona
left join public.sectores s on s.id_sector = l.id_sector
left join public.unidades_organizativas uo on uo.id_unidad = s.id_unidad
left join public.direcciones d on d.id_direccion = uo.id_direccion
left join public.secretarias se on se.id_secretaria = d.id_secretaria
left join public.udos_presupuestarias u on u.id_udo = se.id_udo
left join public.categorias c on c.id_categoria = l.id_categoria;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'No tenés permiso para administrar usuarios.';
  end if;
  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role);
end $$;
revoke all on function public.admin_set_user_role(uuid, public.app_role) from public;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;

create or replace function public.eliminar_persona_legajo(p_id_legajo bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_id_persona bigint;
begin
  if not public.can_write(auth.uid()) then
    raise exception 'No tenés permiso para eliminar registros.';
  end if;
  select id_persona into v_id_persona from public.legajo where id_legajo = p_id_legajo;
  if v_id_persona is null then
    raise exception 'No se encontró el registro.';
  end if;
  delete from public.historial_laboral where id_legajo = p_id_legajo;
  delete from public.legajo where id_legajo = p_id_legajo;
  delete from public.personas where id_persona = v_id_persona;
end $$;
revoke all on function public.eliminar_persona_legajo(bigint) from public;
grant execute on function public.eliminar_persona_legajo(bigint) to authenticated;

create or replace function public.crear_persona_legajo(p_persona jsonb, p_legajo jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id_persona bigint; v_id_legajo bigint;
begin
  if not public.can_write(auth.uid()) then
    raise exception 'No tenés permiso para agregar registros.';
  end if;
  insert into public.personas (apellido_nombre, dni, cuil, sexo, fecha_nacimiento)
  values (
    p_persona->>'apellido_nombre',
    nullif(p_persona->>'dni', ''),
    nullif(p_persona->>'cuil', ''),
    nullif(p_persona->>'sexo', ''),
    nullif(p_persona->>'fecha_nacimiento', '')::date
  )
  returning id_persona into v_id_persona;

  insert into public.legajo (id_persona, id_sector, id_relacion_laboral, id_categoria, id_agrupamiento, id_funcion, dependencia)
  values (
    v_id_persona,
    nullif(p_legajo->>'id_sector', '')::bigint,
    nullif(p_legajo->>'id_relacion_laboral', '')::bigint,
    nullif(p_legajo->>'id_categoria', '')::bigint,
    nullif(p_legajo->>'id_agrupamiento', '')::bigint,
    nullif(p_legajo->>'id_funcion', '')::bigint,
    nullif(p_legajo->>'dependencia', '')
  )
  returning id_legajo into v_id_legajo;

  return v_id_legajo;
end $$;
revoke all on function public.crear_persona_legajo(jsonb, jsonb) from public;
grant execute on function public.crear_persona_legajo(jsonb, jsonb) to authenticated;

create or replace function public.importar_personas_legajos(p_filas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  fila jsonb;
  resultados jsonb := '[]'::jsonb;
  v_dni text; v_cuil text; v_nombre text;
  v_id_udo bigint; v_id_rel bigint; v_id_cat bigint; v_id_agr bigint; v_id_fun bigint;
  v_id_persona bigint;
begin
  if not public.can_write(auth.uid()) then
    raise exception 'No tenés permiso para importar registros.';
  end if;

  for fila in select * from jsonb_array_elements(p_filas) loop
    v_nombre := nullif(btrim(fila->>'apellido_nombre'), '');
    v_dni := nullif(btrim(fila->>'dni'), '');
    v_cuil := nullif(btrim(fila->>'cuil'), '');

    if v_nombre is null then
      resultados := resultados || jsonb_build_object('fila', (fila->>'fila')::int, 'estado', 'error', 'mensaje', 'Falta el apellido y nombre.');
      continue;
    end if;

    if v_dni is not null and exists (select 1 from public.personas where dni = v_dni) then
      resultados := resultados || jsonb_build_object('fila', (fila->>'fila')::int, 'estado', 'omitido', 'mensaje', 'Ya existe una persona con ese DNI.');
      continue;
    end if;
    if v_cuil is not null and exists (select 1 from public.personas where cuil = v_cuil) then
      resultados := resultados || jsonb_build_object('fila', (fila->>'fila')::int, 'estado', 'omitido', 'mensaje', 'Ya existe una persona con ese CUIL.');
      continue;
    end if;

    select id_udo into v_id_udo from public.udos_presupuestarias
      where lower(btrim(descripcion)) = lower(btrim(fila->>'udo')) limit 1;
    select id_relacion_laboral into v_id_rel from public.relaciones_laborales
      where lower(btrim(descripcion)) = lower(btrim(fila->>'relacion_laboral')) limit 1;
    select id_categoria into v_id_cat from public.categorias
      where lower(btrim(descripcion)) = lower(btrim(fila->>'categoria')) limit 1;
    select id_agrupamiento into v_id_agr from public.agrupamientos
      where lower(btrim(descripcion)) = lower(btrim(fila->>'agrupamiento')) limit 1;
    select id_funcion into v_id_fun from public.funciones
      where lower(btrim(descripcion)) = lower(btrim(fila->>'funcion')) limit 1;

    begin
      insert into public.personas (apellido_nombre, dni, cuil, sexo, fecha_nacimiento)
      values (v_nombre, v_dni, v_cuil, nullif(btrim(fila->>'sexo'), ''), nullif(fila->>'fecha_nacimiento', '')::date)
      returning id_persona into v_id_persona;

      insert into public.legajo (id_persona, id_udo, id_relacion_laboral, id_categoria, id_agrupamiento, id_funcion, dependencia)
      values (v_id_persona, v_id_udo, v_id_rel, v_id_cat, v_id_agr, v_id_fun, nullif(btrim(fila->>'dependencia'), ''));

      resultados := resultados || jsonb_build_object('fila', (fila->>'fila')::int, 'estado', 'importado', 'mensaje', 'Importado correctamente.');
    exception when others then
      resultados := resultados || jsonb_build_object('fila', (fila->>'fila')::int, 'estado', 'error', 'mensaje', sqlerrm);
    end;
  end loop;

  return resultados;
end $$;
revoke all on function public.importar_personas_legajos(jsonb) from public;
grant execute on function public.importar_personas_legajos(jsonb) to authenticated;