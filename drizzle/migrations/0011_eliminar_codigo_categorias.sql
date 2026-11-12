-- Remove the obsolete category code field.
alter table public.categorias
  drop column if exists codigo;
--> statement-breakpoint

notify pgrst, 'reload schema';
