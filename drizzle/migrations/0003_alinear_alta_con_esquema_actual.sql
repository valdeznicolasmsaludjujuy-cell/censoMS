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

  insert into public.personas (
    apellido_nombre, dni, cuil, sexo, fecha_nacimiento
  )
  values (
    btrim(p_persona->>'apellido_nombre'),
    nullif(p_persona->>'dni', ''),
    nullif(p_persona->>'cuil', ''),
    nullif(p_persona->>'sexo', ''),
    nullif(p_persona->>'fecha_nacimiento', '')::date
  )
  returning id_persona into v_id_persona;

  insert into public.legajo (
    id_persona, id_sector, id_relacion_laboral, id_categoria,
    id_agrupamiento, id_funcion, dependencia
  )
  values (
    v_id_persona,
    nullif(p_legajo->>'id_sector', '')::bigint,
    nullif(p_legajo->>'id_relacion_laboral', '')::bigint,
    nullif(p_legajo->>'id_categoria', '')::bigint,
    nullif(p_legajo->>'id_agrupamiento', '')::bigint,
    nullif(p_legajo->>'id_funcion', '')::bigint,
    nullif(p_legajo->>'dependencia', '')
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
