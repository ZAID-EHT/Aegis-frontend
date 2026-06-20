-- ============================================================================
-- AEGIS — Governance & Access Monitoring (Supabase / Postgres)
-- Enforce, don't trust: the DB writes the audit trail via triggers, RLS makes
-- it admin-readable and append-only. An action cannot happen unlogged.
--
-- NOTE: audit_log (governance: who did what to the SYSTEM) is deliberately
-- separate from activity_log (student workspace telemetry → health score).
-- ============================================================================

create extension if not exists pgcrypto;   -- for sha256 digest (hash chain)

-- ── governed action vocabulary ──────────────────────────────────────────────
do $$ begin
  create type gov_action as enum (
    'lecturer_approved','lecturer_revoked','cohort_assigned','cohort_unassigned',
    'role_changed','allocation_run','recommendation_overridden','appeal_decided',
    'data_exported','alert_acknowledged','login'
  );
exception when duplicate_object then null; end $$;

-- ── 1. AUDIT LOG (append-only, hash-chained) ────────────────────────────────
create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid not null,                 -- auth.users.id
  actor_role  text not null,
  action      gov_action not null,
  target_type text,
  target_id   text,
  reason      text,                          -- REQUIRED for overrides/appeals (see trigger)
  metadata    jsonb not null default '{}'::jsonb,
  prev_hash   text,                          -- tamper-evidence: chain of sha256
  row_hash    text,
  created_at  timestamptz not null default now()
);

-- hash chain: each row commits to the previous one. Any edit/delete breaks the chain.
-- search_path pinned (definer hardening); an advisory lock serialises appends so two
-- concurrent inserts can't read the same predecessor and fork the chain; the digest is
-- a structured jsonb array (injection-resistant) covering EVERY field incl. id/actor_role/
-- target_type, with a canonical UTC timestamp so verify is timezone-stable.
create or replace function audit_chain() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
declare prev text; ts text;
begin
  perform pg_advisory_xact_lock(hashtext('aegis.audit_log'));
  select row_hash into prev from audit_log order by id desc limit 1;
  new.prev_hash := coalesce(prev, 'GENESIS');
  ts := to_char(new.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
  new.row_hash := encode(digest(convert_to(jsonb_build_array(
      new.prev_hash, new.id, new.actor_id::text, new.actor_role, new.action::text,
      new.target_type, new.target_id, new.reason, new.metadata, ts)::text, 'utf8'),
      'sha256'), 'hex');
  return new;
end $$;

drop trigger if exists trg_audit_chain on audit_log;
create trigger trg_audit_chain before insert on audit_log
  for each row execute function audit_chain();

-- integrity check the admin console calls: returns the first broken row, or NULL if intact
create or replace function audit_verify() returns table(broken_at bigint)
language plpgsql security definer set search_path = public, pg_catalog as $$
declare r record; prev text := 'GENESIS'; calc text; ts text;
begin
  for r in select * from audit_log order by id loop
    ts := to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
    calc := encode(digest(convert_to(jsonb_build_array(
            prev, r.id, r.actor_id::text, r.actor_role, r.action::text,
            r.target_type, r.target_id, r.reason, r.metadata, ts)::text, 'utf8'),
            'sha256'), 'hex');
    if calc <> r.row_hash or r.prev_hash <> prev then
      broken_at := r.id; return next; return;
    end if;
    prev := r.row_hash;
  end loop;
end $$;

-- ── 2. ACCESS GRANTS (who granted whom what) ────────────────────────────────
create table if not exists access_grants (
  id          uuid primary key default gen_random_uuid(),
  grantee_id  uuid not null,
  grant_type  text not null,                 -- 'lecturer_role' | 'cohort_assignment'
  scope_id    text,                          -- cohort_id for assignments
  granted_by  uuid not null,
  granted_at  timestamptz not null default now(),
  revoked_by  uuid,
  revoked_at  timestamptz
);

-- ── 3. RLS: append-only audit, admin-gated reads ────────────────────────────
alter table audit_log     enable row level security;
alter table access_grants enable row level security;

-- admin reads everything; a user may read only their own audit events.
create policy audit_read on audit_log for select using (
  (select role from profiles where id = auth.uid()) = 'admin'
  or actor_id = auth.uid()
);
-- NO update/delete policies → default-deny makes the log append-only for everyone.
-- (Inserts arrive via SECURITY DEFINER trigger functions below, not direct client writes.)

create policy grants_admin_all on access_grants for all using (
  (select role from profiles where id = auth.uid()) = 'admin'
) with check (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- ── 4. ENFORCEMENT TRIGGERS (the "can't forget to log" part) ────────────────

-- a) lecturer override of an engine recommendation (highest-value governance event)
--    assumes teams has columns: status, override_reason
-- system/service_role actor when there is no authenticated user (auth.uid() is NULL),
-- so the NOT NULL actor_id never rolls back a legitimate backend write.
create or replace function log_override() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if new.override_reason is null or btrim(new.override_reason) = '' then
    raise exception 'override requires a reason';   -- policy: no silent overrides
  end if;
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, reason, metadata)
  values (coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
          coalesce((select role from profiles where id = auth.uid()), 'service_role'),
          'recommendation_overridden', 'team', new.id::text, new.override_reason,
          jsonb_build_object('from', old.status, 'to', new.status));
  return new;
end $$;

drop trigger if exists trg_log_override on teams;
create trigger trg_log_override after update on teams
  for each row when (new.override_reason is distinct from old.override_reason)
  execute function log_override();

-- b) role change (ties to security finding C3: only admin, and always audited)
-- An authenticated non-admin can never reach here (the BEFORE UPDATE trigger in 0001
-- already raises); this logs the admin/service_role path and never inserts a NULL actor.
create or replace function log_role_change() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  if auth.uid() is not null and not is_admin() then
    raise exception 'only an admin may change a role';
  end if;
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, metadata)
  values (coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
          coalesce((select role from profiles where id = auth.uid()), 'service_role'),
          'role_changed', 'profile', new.id::text,
          jsonb_build_object('from', old.role, 'to', new.role));
  return new;
end $$;

drop trigger if exists trg_log_role on profiles;
create trigger trg_log_role after update on profiles
  for each row when (new.role is distinct from old.role)
  execute function log_role_change();

-- c) lecturer approval / cohort assignment mirror into the audit log
create or replace function log_grant() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  insert into audit_log(actor_id, actor_role, action, target_type, target_id, metadata)
  values (coalesce(new.granted_by, auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
          'admin',
          case new.grant_type when 'lecturer_role' then 'lecturer_approved'
                              else 'cohort_assigned' end,
          'user', new.grantee_id::text,
          jsonb_build_object('grant_type', new.grant_type, 'scope', new.scope_id));
  return new;
end $$;

drop trigger if exists trg_log_grant on access_grants;
create trigger trg_log_grant after insert on access_grants
  for each row execute function log_grant();

-- d) allocation runs and appeal decisions are app-level events — record them
--    explicitly from the backend with service_role:
--    insert into audit_log(actor_id, actor_role, action, target_type, target_id, reason, metadata) ...
-- ============================================================================
