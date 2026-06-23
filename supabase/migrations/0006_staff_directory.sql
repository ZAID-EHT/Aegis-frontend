-- ============================================================================
-- AEGIS — 0006: staff_directory + directory-sourced role assignment   ***DRAFT***
-- ----------------------------------------------------------------------------
-- STATUS: DRAFT — NOT APPLIED to any database. Review the checklist below, then
--         apply manually in the Supabase SQL editor against a NON-PROD project
--         first. This file makes NO network/live change by existing.
--
-- WHAT THIS DOES
--   1. Creates `staff_directory(email PK, role in ('lecturer','admin'))` — the
--      single admin-controlled source of truth for who is staff.
--   2. Locks it down with RLS: only an admin (or the service_role backend, which
--      bypasses RLS) may INSERT/UPDATE/DELETE/SELECT. This table IS the privilege-
--      escalation surface: whoever can write a row can mint admins. Treat write
--      access to it exactly like write access to `profiles.role`.
--   3. Rewrites `handle_new_user()` so a new signup's role comes ONLY from a
--      lookup of NEW.email in staff_directory; if absent → role='student'.
--      Status: staff → 'approved', everyone else → 'pending' (unchanged default).
--   4. Re-asserts the `on auth.users` trigger that fires handle_new_user, because
--      it currently exists ONLY in the live DB and in no tracked migration
--      (see AUTH_AUDIT.md §4). Idempotent.
--
-- SECURITY INVARIANTS (must remain true — verify in review):
--   • role is sourced ONLY from (a) the staff_directory lookup keyed by email, or
--     (b) the hard-coded 'student' default. It is NEVER read from
--     NEW.raw_user_meta_data or any other client-supplied field. The email is a
--     LOOKUP KEY against an admin-owned table, never itself a role value.
--   • A user controls their own email at signup, but NOT which emails are in
--     staff_directory — so they cannot self-elevate. Putting an attacker's email
--     in the directory requires admin/service_role write, which RLS denies.
--   • staff_directory.role is constrained to ('lecturer','admin'); 'student' is
--     never stored there (it is the default-absent case), so a typo can't grant
--     an unexpected role tier.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ BEFORE YOU APPLY — VERIFY ALL OF THESE:                                    │
-- │  [ ] Run against a NON-PROD Supabase project first; eyeball the result.    │
-- │  [ ] Confirm the live `profiles` columns are (id, email, role, cohort_id,  │
-- │      status). If `profiles` instead has full_name and no email, this       │
-- │      function's INSERT column list must be reconciled FIRST (schema-drift  │
-- │      risk flagged in the docs). Do not apply until the column list matches.│
-- │  [ ] Confirm `is_admin()` exists (created in 0001/0004). This migration    │
-- │      depends on it for the RLS policies.                                   │
-- │  [ ] Decide whether to keep the `on auth.users` trigger re-assertion       │
-- │      (section 4). It needs ownership/elevated rights on auth.users; in the  │
-- │      Supabase SQL editor (postgres role) it works. If your live trigger is  │
-- │      already correct and you do NOT want to touch it, comment out section 4.│
-- │  [ ] Seed the directory from a GITIGNORED source AFTER applying — never add │
-- │      real institutional emails to this committed file. Use                 │
-- │      supabase/staff_directory_seed.example.sql as a template; copy it to    │
-- │      supabase/staff_directory_seed.local.sql (gitignored) with real emails  │
-- │      and run that separately, OR upsert via the service_role backend.       │
-- │  [ ] After seeding, test BOTH paths: a directory email signs up → lands     │
-- │      lecturer/admin + approved; a non-directory email → student + pending.  │
-- │  [ ] Re-confirm a non-admin client cannot INSERT/UPDATE/DELETE the table    │
-- │      (expect RLS denial) — this is the escalation surface.                  │
-- └──────────────────────────────────────────────────────────────────────────┘
-- Idempotent + transactional; safe to re-run once reviewed.
-- ============================================================================
begin;

-- ── 0. dependency guard: is_admin() must already exist (0001/0004) ───────────
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    raise exception '0006 requires public.is_admin() (from 0001/0004). Apply those first.';
  end if;
end $$;

-- ── 1. the admin-controlled staff directory ──────────────────────────────────
-- email is stored lower-cased (see the lookup in section 3, which uses lower()).
create table if not exists public.staff_directory (
  email      text primary key,
  role       text not null check (role in ('lecturer','admin')),
  note       text,                              -- optional: who/why, for the admin's reference
  created_at timestamptz not null default now()
);

-- ── 2. RLS: admin-only everything; service_role bypasses RLS implicitly ──────
-- DEFAULT-DENY: enabling RLS with no permissive policy = no access for anon/auth.
-- The single admin-only policy below is the ONLY grant. handle_new_user reads the
-- table as SECURITY DEFINER (runs as the function owner), so it is unaffected by
-- RLS and does NOT need a read policy here — keep the table fully closed to clients.
alter table public.staff_directory enable row level security;

drop policy if exists staff_directory_admin_all on public.staff_directory;
create policy staff_directory_admin_all on public.staff_directory
  for all
  using (public.is_admin())          -- read/identify rows: admin only
  with check (public.is_admin());    -- write rows: admin only  (service_role bypasses RLS)

-- Explicitly NO policy for anon/authenticated non-admins → every
-- SELECT/INSERT/UPDATE/DELETE by them is denied by default. This is the control.

-- ── 3. signup trigger: role comes ONLY from the directory or the 'student' default
-- SECURITY DEFINER + pinned search_path so a caller-controlled path can't shadow
-- public/pg_catalog. NOTE: 0004's version was missing `set search_path` — this
-- restores that hardening (matches every other SECURITY DEFINER fn in this repo).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare
  v_role   text;
  v_status text;
begin
  -- LOOKUP, not trust: NEW.email is a key against the admin-owned directory.
  -- raw_user_meta_data is deliberately never consulted for role.
  select sd.role into v_role
  from public.staff_directory sd
  where lower(sd.email) = lower(new.email);

  if v_role is null then
    v_role   := 'student';     -- hard-coded default; the ONLY non-directory source of role
    v_status := 'pending';     -- unchanged default lifecycle
  else
    v_status := 'approved';    -- pre-vetted staff are active immediately
  end if;

  insert into public.profiles (id, email, role, cohort_id, status)
  values (new.id, new.email, v_role, null, v_status)
  on conflict (id) do nothing;  -- idempotent: a replayed signup never errors

  return new;
end $$;

-- ── 4. re-assert the auth.users trigger (currently live-only; see AUTH_AUDIT §4)
-- Comment this section out if you do NOT want 0006 to touch auth.users. Leaving it
-- in makes the trigger captured-in-migrations instead of existing only in the live DB.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;

-- ── POST-APPLY (run SEPARATELY, from a gitignored source — NEVER commit emails) ─
-- Example (copy supabase/staff_directory_seed.example.sql → *.local.sql, fill real
-- emails, run that file). Real institutional addresses must stay out of this repo.
--   insert into public.staff_directory (email, role) values
--     (lower('first.last@your-institution.edu'), 'lecturer')
--   on conflict (email) do update set role = excluded.role;
