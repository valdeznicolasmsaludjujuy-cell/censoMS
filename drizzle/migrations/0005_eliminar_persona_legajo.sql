create or replace function public.eliminar_persona_legajo(p_id_legajo bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id_persona bigint;
begin
  if auth.uid() is null or not public.can_write(auth.uid()) then
    raise exception 'No tenés permiso para eliminar registros'
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
--> statement-breakpoint

revoke all on function public.eliminar_persona_legajo(bigint) from public, anon;
--> statement-breakpoint

grant execute on function public.eliminar_persona_legajo(bigint) to authenticated;
--> statement-breakpoint

notify pgrst, 'reload schema';
