do $$
begin
  if to_regclass('public.novedades') is null then
    raise exception 'La tabla public.novedades debe existir antes de aplicar esta migración';
  end if;
  if to_regclass('public.tipos_novedad') is null then
    raise exception 'La tabla public.tipos_novedad debe existir antes de aplicar esta migración';
  end if;
end $$;

grant select on public.tipos_novedad to authenticated;
alter table public.tipos_novedad enable row level security;
drop policy if exists "tipos_novedad_read" on public.tipos_novedad;
create policy "tipos_novedad_read"
  on public.tipos_novedad
  for select
  to authenticated
  using (public.can_read(auth.uid()));

grant select, insert on public.novedades to authenticated;
alter table public.novedades enable row level security;
drop policy if exists "novedades_read" on public.novedades;
drop policy if exists "novedades_insert" on public.novedades;
create policy "novedades_read"
  on public.novedades
  for select
  to authenticated
  using (public.can_read(auth.uid()));
create policy "novedades_insert"
  on public.novedades
  for insert
  to authenticated
  with check (public.can_write(auth.uid()));
