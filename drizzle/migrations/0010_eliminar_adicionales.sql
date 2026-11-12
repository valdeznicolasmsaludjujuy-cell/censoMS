-- Remove the additional catalog and its foreign-key references from legajo.
-- Keep the legacy numeric amount columns to avoid discarding existing values.
alter table if exists public.legajo
  drop column if exists id_adic_mayor_horario,
  drop column if exists id_adic_jefatura;
--> statement-breakpoint

drop table if exists public.adicionales;
--> statement-breakpoint

notify pgrst, 'reload schema';
