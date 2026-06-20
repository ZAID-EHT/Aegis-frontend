-- ============================================================================
-- AEGIS — Base schema (Supabase / Postgres)
-- Core relational model + Row Level Security. RLS is the load-bearing control:
-- the anon key is safe ONLY because every table is default-deny and scoped here
-- (SECURITY_REVIEW C2/C3/H1). 0002_governance.sql builds the audit spine on top.
--
-- Identity: a student/lecturer/admin's primary key IS their auth.users id, so
-- auth.uid() can be compared directly to profiles.id / team_members.student_id.
-- ============================================================================

-- ── profiles: one row per authenticated user; role is NOT self-assignable ────
create table if not exists profiles (
  id         uuid primary key,                       -- = auth.users.id
  full_name  text,
  role       text not null default 'student'
             check (role in ('student','lecturer','admin')),
  cohort_id  text,
  created_at timestamptz not null default now()
);

-- lecturers are scoped to the cohorts an admin assigns them (H1 authorization).
create table if not exists lecturer_cohorts (
  lecturer_id uuid not null references profiles(id) on delete cascade,
  cohort_id   text not null,
  primary key (lecturer_id, cohort_id)
);

-- ── domain tables ────────────────────────────────────────────────────────────
create table if not exists students (
  id                   uuid primary key,             -- = auth.users.id for that student
  cohort_id            text,
  name                 text not null,
  email                text not null,
  capacity_hours       numeric not null default 0 check (capacity_hours >= 0),
  preferred_teammate_id uuid references students(id)
);

create table if not exists projects (
  id            text primary key,
  title         text not null,
  abstract      text not null,
  supervisor_id uuid references profiles(id),
  capacity      int  not null check (capacity > 0)
);

create table if not exists skills_declared (
  id              bigint generated always as identity primary key,
  student_id      uuid not null references students(id) on delete cascade,
  discipline      text not null,
  declared_level  numeric not null check (declared_level between 1 and 5),
  confidence_basis text not null
                  check (confidence_basis in ('verified','portfolio','self_report','contradicted')),
  adjusted_score  numeric,
  unique (student_id, discipline)
);

create table if not exists teams (
  id              text primary key,
  project_id      text not null references projects(id),
  health_score    numeric,
  status          text not null default 'formed',     -- 0002 logs transitions
  override_reason text                                  -- 0002 trigger requires this on override
);

create table if not exists team_members (
  team_id    text not null references teams(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  role       text,
  primary key (team_id, student_id)
);

create table if not exists tasks (
  id              bigint generated always as identity primary key,
  team_id         text not null references teams(id) on delete cascade,
  assignee_id     uuid references students(id),
  hours_estimated numeric not null default 0,
  status          text not null default 'todo'
);

-- workspace telemetry feeding the health score (distinct from the governance audit_log).
create table if not exists activity_log (
  id         bigint generated always as identity primary key,
  student_id uuid not null references students(id) on delete cascade,
  file_id    text,
  action     text not null,
  ts         timestamptz not null default now()
);

create table if not exists alerts (
  id           bigint generated always as identity primary key,
  team_id      text references teams(id) on delete cascade,
  severity     text not null check (severity in ('INFO','WARNING','CRITICAL')),
  trigger_type text not null,
  detail       text,
  created_at   timestamptz not null default now(),
  resolved     boolean not null default false
);

create index if not exists idx_team_members_student on team_members(student_id);
create index if not exists idx_skills_student       on skills_declared(student_id);
create index if not exists idx_activity_student     on activity_log(student_id);
create index if not exists idx_alerts_team          on alerts(team_id);
-- columns joined inside RLS policy subqueries (kept indexed so per-row checks don't seq-scan)
create index if not exists idx_lecturer_cohorts_cohort on lecturer_cohorts(cohort_id);
create index if not exists idx_students_cohort         on students(cohort_id);
create index if not exists idx_projects_supervisor     on projects(supervisor_id);
create index if not exists idx_teams_project           on teams(project_id);

-- ── helper: is the current user an admin? (SECURITY DEFINER avoids RLS recursion) ─
-- search_path is pinned so a caller-controlled path can't shadow profiles/pg_catalog.
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public, pg_catalog as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Role immutability (C3), enforced where it actually works — a BEFORE UPDATE trigger
-- comparing OLD vs NEW (RLS WITH CHECK cannot see OLD). Only an admin may change a role.
create or replace function enforce_role_immutable() returns trigger
language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  -- block authenticated non-admins; a NULL auth.uid() is the trusted service_role
  -- backend (0002 logs that path), so it is allowed through here.
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    raise exception 'role is not self-assignable';
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_role on profiles;
create trigger trg_enforce_role before update on profiles
  for each row execute function enforce_role_immutable();

-- ── RLS: enable + DEFAULT-DENY on every table (C2). No policy = no access. ────
alter table profiles        enable row level security;
alter table lecturer_cohorts enable row level security;
alter table students        enable row level security;
alter table projects        enable row level security;
alter table skills_declared enable row level security;
alter table teams           enable row level security;
alter table team_members    enable row level security;
alter table tasks           enable row level security;
alter table activity_log    enable row level security;
alter table alerts          enable row level security;

-- profiles: read own; admins read all. A user may update their own row; role changes
-- are blocked by the enforce_role_immutable trigger above (not a fragile RLS subquery).
create policy profiles_read_own on profiles for select
  using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- admin-managed inserts/role changes (also still subject to the trigger, which admins pass).
create policy profiles_admin_write on profiles for all
  using (is_admin()) with check (is_admin());

-- lecturer_cohorts: admin-managed; a lecturer may read their own assignments.
create policy cohorts_admin_all on lecturer_cohorts for all
  using (is_admin()) with check (is_admin());
create policy cohorts_read_own on lecturer_cohorts for select
  using (lecturer_id = auth.uid() or is_admin());

-- students: a student sees teammates; a lecturer sees only their assigned cohort (H1).
create policy students_team_or_cohort on students for select using (
  is_admin()
  or exists (
    select 1 from team_members tm
    where tm.student_id = students.id
      and tm.team_id in (select team_id from team_members where student_id = auth.uid())
  )
  or exists (
    select 1 from lecturer_cohorts lc
    where lc.lecturer_id = auth.uid() and lc.cohort_id = students.cohort_id
  )
);

-- skills: visible to the student themselves, their lecturer (same cohort), and admins.
create policy skills_scope on skills_declared for select using (
  is_admin()
  or student_id = auth.uid()
  or exists (
    select 1 from students s join lecturer_cohorts lc on lc.cohort_id = s.cohort_id
    where s.id = skills_declared.student_id and lc.lecturer_id = auth.uid()
  )
);

-- projects: readable by any authenticated user (catalogue); writable by supervisor/admin.
create policy projects_read on projects for select using (auth.uid() is not null);
create policy projects_write on projects for all
  using (is_admin() or supervisor_id = auth.uid())
  with check (is_admin() or supervisor_id = auth.uid());

-- teams / team_members / tasks / activity / alerts: a member sees their own team;
-- a lecturer sees teams within their cohort; admins see all.
create policy teams_scope on teams for select using (
  is_admin()
  or id in (select team_id from team_members where student_id = auth.uid())
  or project_id in (
    select p.id from projects p join lecturer_cohorts lc on lc.lecturer_id = auth.uid()
    join students s on s.cohort_id = lc.cohort_id
    join team_members tm on tm.student_id = s.id where tm.team_id = teams.id
  )
);
-- a lecturer may update a team they supervise (e.g. status/override) — audited by 0002.
create policy teams_update on teams for update
  using (is_admin() or project_id in (select id from projects where supervisor_id = auth.uid()))
  with check (is_admin() or project_id in (select id from projects where supervisor_id = auth.uid()));

create policy team_members_scope on team_members for select using (
  is_admin()
  or team_id in (select team_id from team_members where student_id = auth.uid())
);

create policy tasks_scope on tasks for select using (
  is_admin()
  or team_id in (select team_id from team_members where student_id = auth.uid())
);

create policy activity_scope on activity_log for select using (
  is_admin() or student_id = auth.uid()
);

create policy alerts_scope on alerts for select using (
  is_admin()
  or team_id in (select team_id from team_members where student_id = auth.uid())
);

-- NOTE: only SELECT (and the audited teams UPDATE) are exposed to anon/auth clients.
-- INSERT/UPDATE/DELETE on teams/team_members/tasks/activity_log/alerts are default-denied
-- and performed by the backend with service_role (the allocation writer, alert dispatcher).
-- This is intentional — add scoped write policies only if a client path ever needs them.
