-- Adds 'exited' as a valid investment status: the investor has fully exited
-- their position, principal + returns settled via payouts.
--
-- Postgres names a single unnamed inline `check (...)` on one column
-- `{table}_{column}_check` by default — that's what migration 0002 relied on
-- implicitly. If this `drop constraint` silently no-ops because the name
-- differs in your project, find the real name with:
--   select conname from pg_constraint where conrelid = 'public.investments'::regclass;

alter table public.investments drop constraint if exists investments_status_check;
alter table public.investments add constraint investments_status_check
  check (status in ('pending','active','matured','cancelled','exited'));
