-- Remove the title catalog and its foreign-key reference.
-- Keep personas.titulo, which is an independent free-text field.
alter table if exists public.personas
  drop column if exists id_titulo;
--> statement-breakpoint

drop table if exists public.titulos;
--> statement-breakpoint

notify pgrst, 'reload schema';
