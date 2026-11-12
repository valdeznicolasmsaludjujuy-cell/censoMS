-- Unauthenticated sign-ups receive no application role and therefore cannot
-- read or modify application data. Managed users are provisioned by an admin.
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  return new;
end;
$$;

create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'No tenés permiso para administrar usuarios'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.admin_set_user_role'));

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'El usuario no existe'
      using errcode = 'P0002';
  end if;

  if p_role <> 'admin' and public.has_role(p_user_id, 'admin') then
    if (select count(*) from public.user_roles where role = 'admin') <= 1 then
      raise exception 'No se puede quitar el rol del único administrador'
        using errcode = '23514';
    end if;
  end if;

  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role);
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.app_role) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;

-- Ensure data-entry accounts cannot change reference catalogs, even if the
-- earlier catalog-hardening migration has not yet been applied.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'udos_presupuestarias',
    'secretarias',
    'direcciones',
    'unidades_organizativas',
    'sectores',
    'relaciones_laborales',
    'escalafones',
    'categorias',
    'agrupamientos',
    'funciones',
    'titulos',
    'lugares_trabajo',
    'adicionales',
    'opciones'
  ] loop
    if to_regclass(format('public.%I', t)) is null then
      continue;
    end if;

    for p in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = t
        and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format('drop policy if exists "admin_catalog_read" on public.%I', t);
    execute format('drop policy if exists "admin_catalog_insert" on public.%I', t);
    execute format('drop policy if exists "admin_catalog_update" on public.%I', t);
    execute format('drop policy if exists "admin_catalog_delete" on public.%I', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "admin_catalog_read" on public.%I for select to authenticated using (public.can_read(auth.uid()))',
      t
    );
    execute format(
      'create policy "admin_catalog_insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), %L::public.app_role))',
      t, 'admin'
    );
    execute format(
      'create policy "admin_catalog_update" on public.%I for update to authenticated using (public.has_role(auth.uid(), %L::public.app_role)) with check (public.has_role(auth.uid(), %L::public.app_role))',
      t, 'admin', 'admin'
    );
    execute format(
      'create policy "admin_catalog_delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), %L::public.app_role))',
      t, 'admin'
    );
  end loop;
end $$;

-- Only administrators may permanently delete personnel records.
create or replace function public.eliminar_persona_legajo(p_id_legajo bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id_persona bigint;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Solo un administrador puede eliminar registros'
      using errcode = '42501';
  end if;

  select id_persona
    into v_id_persona
    from public.legajo
    where id_legajo = p_id_legajo
    for update;

  if not found then
    raise exception 'El registro ya no existe'
      using errcode = 'P0002';
  end if;

  delete from public.historial_laboral
    where id_legajo = p_id_legajo;

  delete from public.legajo
    where id_legajo = p_id_legajo;

  if not exists (
    select 1
      from public.legajo
      where id_persona = v_id_persona
  ) then
    delete from public.personas
      where id_persona = v_id_persona;
  end if;
end;
$$;

notify pgrst, 'reload schema';
