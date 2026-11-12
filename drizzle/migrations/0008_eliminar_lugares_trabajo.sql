-- Remove the obsolete workplace catalog and its unused personnel-record field.
drop view if exists public.v_planilla;
--> statement-breakpoint

alter table if exists public.legajo
  drop column if exists id_lugar;
--> statement-breakpoint

drop table if exists public.lugares_trabajo;
--> statement-breakpoint

create view public.v_planilla with (security_invoker = true) as
select
  l.id_legajo,
  l.controlado,
  l.controlado_at,
  p.id_persona,
  p.apellido_nombre,
  p.dni,
  p.cuil,
  u.codigo as udo_codigo,
  u.descripcion as udo,
  c.descripcion as categoria,
  null::text as validacion
from public.legajo l
join public.personas p on p.id_persona = l.id_persona
left join public.sectores s on s.id_sector = l.id_sector
left join public.unidades_organizativas uo on uo.id_unidad = s.id_unidad
left join public.direcciones d on d.id_direccion = uo.id_direccion
left join public.secretarias se on se.id_secretaria = d.id_secretaria
left join public.udos_presupuestarias u on u.id_udo = se.id_udo
left join public.categorias c on c.id_categoria = l.id_categoria;
--> statement-breakpoint

grant select on public.v_planilla to authenticated;
--> statement-breakpoint

notify pgrst, 'reload schema';
