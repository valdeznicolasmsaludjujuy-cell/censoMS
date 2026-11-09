create or replace function public.crear_persona_legajo(p_persona jsonb, p_legajo jsonb)
returns bigint
language plpgsql
set search_path = public
as $$
declare
  v_id_persona bigint;
begin
  if auth.uid() is null or not public.can_write(auth.uid()) then
    raise exception 'No tenés permiso para agregar personas'
      using errcode = '42501';
  end if;

  if nullif(btrim(p_persona->>'apellido_nombre'), '') is null then
    raise exception 'El apellido y nombre es obligatorio'
      using errcode = '22023';
  end if;

  if nullif(p_persona->>'dni', '') is not null
    and (p_persona->>'dni') !~ '^\d{7,8}$' then
    raise exception 'El DNI debe tener 7 u 8 dígitos'
      using errcode = '22023';
  end if;

  if nullif(p_persona->>'cuil', '') is not null
    and (p_persona->>'cuil') !~ '^\d{11}$' then
    raise exception 'El CUIL debe tener 11 dígitos'
      using errcode = '22023';
  end if;

  if nullif(p_legajo->>'fecha_desde', '') is not null
    and nullif(p_legajo->>'fecha_hasta', '') is not null
    and (p_legajo->>'fecha_hasta')::date < (p_legajo->>'fecha_desde')::date then
    raise exception 'La fecha hasta no puede ser anterior a la fecha desde'
      using errcode = '22023';
  end if;

  insert into public.personas (
    apellido_nombre, dni, cuil, sexo, fecha_nacimiento, titulo, id_titulo
  )
  values (
    btrim(p_persona->>'apellido_nombre'),
    nullif(p_persona->>'dni', ''),
    nullif(p_persona->>'cuil', ''),
    nullif(p_persona->>'sexo', ''),
    nullif(p_persona->>'fecha_nacimiento', '')::date,
    nullif(p_persona->>'titulo', ''),
    nullif(p_persona->>'id_titulo', '')::bigint
  )
  returning id_persona into v_id_persona;

  insert into public.legajo (
    id_persona, id_sector, id_relacion_laboral, id_categoria,
    id_agrupamiento, id_funcion, adic_mayor_horario, adic_por_jefatura,
    afectado, fecha_desde, fecha_hasta, id_udo, id_lugar,
    id_adic_mayor_horario, id_adic_jefatura, afectado_tipo,
    validacion, observacion, dependencia, controlado
  )
  values (
    v_id_persona,
    nullif(p_legajo->>'id_sector', '')::bigint,
    nullif(p_legajo->>'id_relacion_laboral', '')::bigint,
    nullif(p_legajo->>'id_categoria', '')::bigint,
    nullif(p_legajo->>'id_agrupamiento', '')::bigint,
    nullif(p_legajo->>'id_funcion', '')::bigint,
    nullif(p_legajo->>'adic_mayor_horario', '')::numeric,
    nullif(p_legajo->>'adic_por_jefatura', '')::numeric,
    coalesce((p_legajo->>'afectado')::boolean, false),
    nullif(p_legajo->>'fecha_desde', '')::date,
    nullif(p_legajo->>'fecha_hasta', '')::date,
    nullif(p_legajo->>'id_udo', '')::bigint,
    nullif(p_legajo->>'id_lugar', '')::bigint,
    nullif(p_legajo->>'id_adic_mayor_horario', '')::bigint,
    nullif(p_legajo->>'id_adic_jefatura', '')::bigint,
    nullif(p_legajo->>'afectado_tipo', ''),
    nullif(p_legajo->>'validacion', ''),
    nullif(p_legajo->>'observacion', ''),
    nullif(p_legajo->>'dependencia', ''),
    false
  );

  return v_id_persona;
end;
$$;
--> statement-breakpoint

revoke all on function public.crear_persona_legajo(jsonb, jsonb) from public, anon;
--> statement-breakpoint

grant execute on function public.crear_persona_legajo(jsonb, jsonb) to authenticated;
--> statement-breakpoint

notify pgrst, 'reload schema';
