create or replace function public.importar_personas_legajos(p_filas jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila jsonb;
  v_numero integer;
  v_resultados jsonb := '[]'::jsonb;
  v_nombre text;
  v_dni text;
  v_cuil text;
  v_sexo text;
  v_fecha date;
  v_udo text;
  v_relacion text;
  v_categoria text;
  v_escalafon text;
  v_agrupamiento text;
  v_dependencia text;
  v_funcion text;
  v_id_relacion bigint;
  v_id_categoria bigint;
  v_id_escalafon bigint;
  v_id_agrupamiento bigint;
  v_id_funcion bigint;
  v_id_persona bigint;
  v_cantidad integer;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Solo un administrador puede importar registros'
      using errcode = '42501';
  end if;

  if p_filas is null or jsonb_typeof(p_filas) <> 'array' then
    raise exception 'El archivo de importación no tiene un formato válido'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_filas) > 1000 then
    raise exception 'Se permite importar hasta 1.000 filas por archivo'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.importar_personas_legajos'));

  for v_fila in select value from jsonb_array_elements(p_filas)
  loop
    v_numero := coalesce(nullif(v_fila->>'fila', '')::integer, 0);
    begin
      v_nombre := nullif(btrim(v_fila->>'apellido_nombre'), '');
      v_dni := nullif(regexp_replace(coalesce(v_fila->>'dni', ''), '\D', '', 'g'), '');
      v_cuil := nullif(regexp_replace(coalesce(v_fila->>'cuil', ''), '\D', '', 'g'), '');
      v_sexo := nullif(upper(btrim(v_fila->>'sexo')), '');
      v_fecha := nullif(v_fila->>'fecha_nacimiento', '')::date;
      v_udo := nullif(btrim(v_fila->>'udo'), '');
      v_relacion := nullif(btrim(v_fila->>'relacion_laboral'), '');
      v_categoria := nullif(btrim(v_fila->>'categoria'), '');
      v_escalafon := nullif(btrim(v_fila->>'escalafon'), '');
      v_agrupamiento := nullif(btrim(v_fila->>'agrupamiento'), '');
      v_dependencia := nullif(btrim(v_fila->>'dependencia'), '');
      v_funcion := nullif(btrim(v_fila->>'funcion'), '');

      if v_nombre is null then
        raise exception 'Falta apellido y nombre';
      end if;

      if v_dni is null and v_cuil is null then
        raise exception 'Se requiere DNI o CUIL para detectar duplicados';
      end if;

      if v_dni is not null and v_dni !~ '^\d{7,8}$' then
        raise exception 'El DNI debe tener 7 u 8 dígitos';
      end if;

      if v_cuil is not null and v_cuil !~ '^\d{11}$' then
        raise exception 'El CUIL debe tener 11 dígitos';
      end if;

      if exists (
        select 1
        from public.personas p
        where (v_dni is not null and regexp_replace(coalesce(p.dni, ''), '\D', '', 'g') = v_dni)
           or (v_cuil is not null and regexp_replace(coalesce(p.cuil, ''), '\D', '', 'g') = v_cuil)
      ) then
        v_resultados := v_resultados || jsonb_build_array(jsonb_build_object(
          'fila', v_numero,
          'estado', 'omitido',
          'mensaje', 'Ya existe una persona con el mismo DNI o CUIL'
        ));
        continue;
      end if;

      if v_udo is not null then
        select count(*)::integer
          into v_cantidad
          from public.udos_presupuestarias
          where lower(btrim(codigo)) = lower(v_udo)
             or lower(btrim(descripcion)) = lower(v_udo);
        if v_cantidad = 0 then
          raise exception 'No se encontró la UDO indicada';
        elsif v_cantidad > 1 then
          raise exception 'La UDO indicada coincide con más de un registro';
        end if;
      end if;

      v_id_relacion := null;
      if v_relacion is not null then
        select count(*)::integer, min(id_relacion_laboral)
          into v_cantidad, v_id_relacion
          from public.relaciones_laborales
          where lower(btrim(descripcion)) = lower(v_relacion);
        if v_cantidad = 0 then
          raise exception 'No se encontró la relación laboral indicada';
        elsif v_cantidad > 1 then
          raise exception 'La relación laboral indicada es ambigua';
        end if;
      end if;

      v_id_escalafon := null;
      if v_escalafon is not null then
        select count(*)::integer, min(id_escalafon)
          into v_cantidad, v_id_escalafon
          from public.escalafones
          where lower(btrim(descripcion)) = lower(v_escalafon);
        if v_cantidad = 0 then
          raise exception 'No se encontró el escalafón indicado';
        elsif v_cantidad > 1 then
          raise exception 'El escalafón indicado es ambiguo';
        end if;
      end if;

      v_id_categoria := null;
      if v_categoria is not null then
        select count(*)::integer, min(id_categoria)
          into v_cantidad, v_id_categoria
          from public.categorias
          where lower(btrim(descripcion)) = lower(v_categoria)
            and (v_id_escalafon is null or id_escalafon = v_id_escalafon);
        if v_cantidad = 0 then
          raise exception 'No se encontró la categoría para el escalafón indicado';
        elsif v_cantidad > 1 then
          raise exception 'La categoría indicada es ambigua; completá el escalafón';
        end if;
      end if;

      v_id_agrupamiento := null;
      if v_agrupamiento is not null then
        select count(*)::integer, min(id_agrupamiento)
          into v_cantidad, v_id_agrupamiento
          from public.agrupamientos
          where lower(btrim(descripcion)) = lower(v_agrupamiento);
        if v_cantidad = 0 then
          raise exception 'No se encontró el agrupamiento indicado';
        elsif v_cantidad > 1 then
          raise exception 'El agrupamiento indicado es ambiguo';
        end if;
      end if;

      v_id_funcion := null;
      if v_funcion is not null then
        select count(*)::integer, min(id_funcion)
          into v_cantidad, v_id_funcion
          from public.funciones
          where lower(btrim(descripcion)) = lower(v_funcion);
        if v_cantidad = 0 then
          raise exception 'No se encontró la función indicada';
        elsif v_cantidad > 1 then
          raise exception 'La función indicada es ambigua';
        end if;
      end if;

      insert into public.personas (
        apellido_nombre, dni, cuil, sexo, fecha_nacimiento
      )
      values (v_nombre, v_dni, v_cuil, v_sexo, v_fecha)
      returning id_persona into v_id_persona;

      insert into public.legajo (
        id_persona,
        id_relacion_laboral,
        id_categoria,
        id_agrupamiento,
        id_funcion,
        dependencia,
        controlado
      )
      values (
        v_id_persona,
        v_id_relacion,
        v_id_categoria,
        v_id_agrupamiento,
        v_id_funcion,
        v_dependencia,
        false
      );

      v_resultados := v_resultados || jsonb_build_array(jsonb_build_object(
        'fila', v_numero,
        'estado', 'importado',
        'mensaje', 'Registro creado; la UDO no se asignó porque el archivo no incluye sector'
      ));
    exception
      when others then
        v_resultados := v_resultados || jsonb_build_array(jsonb_build_object(
          'fila', v_numero,
          'estado', 'error',
          'mensaje', sqlerrm
        ));
    end;
  end loop;

  return v_resultados;
end;
$$;
--> statement-breakpoint

revoke all on function public.importar_personas_legajos(jsonb) from public, anon;
--> statement-breakpoint

grant execute on function public.importar_personas_legajos(jsonb) to authenticated;
--> statement-breakpoint

notify pgrst, 'reload schema';
