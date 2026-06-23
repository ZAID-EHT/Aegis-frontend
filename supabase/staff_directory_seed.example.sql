-- ============================================================================
-- AEGIS — staff_directory seed TEMPLATE (commit THIS file with placeholders only)
-- ----------------------------------------------------------------------------
-- HOW TO USE:
--   1. Apply migration 0006_staff_directory.sql first (creates the table + RLS).
--   2. Copy this file to:  supabase/staff_directory_seed.local.sql
--      (that name is gitignored — see .gitignore — so real emails never commit).
--   3. Replace the placeholder rows with REAL institutional emails + roles.
--   4. Run the .local.sql file in the Supabase SQL editor (you are the admin /
--      service_role, so RLS lets the write through). Re-runnable via upsert.
--
-- ROLE VALUES: only 'lecturer' or 'admin' (the table CHECK enforces this).
-- Students are NOT listed here — absence from the directory IS "student".
-- Emails are matched case-insensitively by handle_new_user(), but store them
-- lower-cased for tidiness.
-- ============================================================================

insert into public.staff_directory (email, role, note) values
  (lower('admin@your-institution.edu'),    'admin',    'replace: course owner'),
  (lower('lecturer1@your-institution.edu'), 'lecturer', 'replace: module lead'),
  (lower('lecturer2@your-institution.edu'), 'lecturer', 'replace: supervisor')
on conflict (email) do update
  set role = excluded.role,
      note = excluded.note;

-- Verify after running:
--   select email, role from public.staff_directory order by role, email;
