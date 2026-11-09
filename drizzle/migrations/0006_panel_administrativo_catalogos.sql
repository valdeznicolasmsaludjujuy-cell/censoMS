-- Limit changes to organization and reference catalogs to administrators.
-- People, personnel records, and employment history retain their existing policies.
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
