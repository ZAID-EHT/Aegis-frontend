# NEXT STEPS — autonomous pre-demo pass (read me first)

This was an autonomous run under hard constraints: **safe, reversible work only; nothing applied
to the live DB or live auth; engine untouched.** A checkpoint commit was made before any change.

---

## What I did (applied — safe, reversible, all in git)

1. **Doc reconciliation (Task 1).** `BUILD_NOTES_PDF.md` rewritten to the **two-run framing** so it
   no longer calls `0.96` a "live" value. Seed run = `0.96 / 84·69·41 / STU_08 / STU_07` (grounded
   in `aegis/seed/seed.json`); live run = `0.911 / 15 teams + 1 exception pool / UUIDs`. Added a
   side-by-side run table and corrected the `[FIG]` source-run mapping. No invented numbers.

2. **Auth audit (Task 2).** `AUTH_AUDIT.md` — full read-only trace of Google login → callback →
   session → `profiles`/role → routing. **Changed no code.** Read it before the demo; the headline
   findings are in §6 and the pre-demo checklist in §7. Most urgent items:
   - **[BLOCKER]** the FastAPI `/admin/*` endpoints are **unauthenticated** — anyone who can reach
     `NEXT_PUBLIC_API_URL` can read governance data and approve/reject accounts (§6). *(Reported
     only; `aegis/` was not modified per the run rules.)*
   - **[VERIFY]** the `on auth.users` trigger that creates profiles exists **only in the live DB**,
     in no tracked migration (§4) — `0006` re-asserts it.

## What's drafted but NOT applied (needs your review + a manual apply)

3. **`supabase/migrations/0006_staff_directory.sql` (Task 3) — DRAFT, not run anywhere.**
   - Creates `staff_directory(email PK, role in ('lecturer','admin'))`, admin/service_role-write-only
     via RLS (default-deny; this is the role-escalation surface).
   - Rewrites `handle_new_user()` so role comes ONLY from the directory lookup (by email) or the
     hard-coded `'student'` default — **never** from `raw_user_meta_data`. Restores the
     `SET search_path` hardening that `0004` was missing.
   - Re-asserts the `on auth.users` trigger (the §4 gap). Section 4 can be commented out if you
     don't want to touch `auth.users`.
   - The file's header has a **BEFORE-YOU-APPLY checklist** — read it; do not skip the schema-column
     check.
4. **`supabase/staff_directory_seed.example.sql`** — committed template (placeholder emails only).
5. **`.gitignore`** — now ignores `supabase/staff_directory_seed.local.sql` and `**/*_seed.local.sql`
   so the real-email seed file never commits.

> Untracked `scripts/seed_demo_users.py` was present before this run (pre-existing demo infra). I
> left it untracked — it's yours to commit or not.

---

## Exact ordered steps for YOU when you're back

**A. Review (5 min)**
1. Read `AUTH_AUDIT.md` (esp. §1, §3, §6 BLOCKER, §7 checklist).
2. Read the header of `supabase/migrations/0006_staff_directory.sql` and the body. Confirm the
   `profiles` column list matches your live schema (`id, email, role, cohort_id, status`). **If your
   live `profiles` differs, fix the INSERT column list before applying.**

**B. Apply the migration (after review)**
3. Apply `0006` to a **non-prod** Supabase project first (SQL editor). Verify:
   - `staff_directory` exists with RLS on; a non-admin client cannot write it.
   - `select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal;`
     shows `on_auth_user_created`.
4. When happy, apply `0006` to the **live** project (it's the next migration after `0005`).

**C. Seed staff + judge access**
5. **staff_directory:** copy `supabase/staff_directory_seed.example.sql` →
   `supabase/staff_directory_seed.local.sql` (gitignored), put the **real** lecturer/admin emails in
   it, run it in the SQL editor. Verify with
   `select email, role from public.staff_directory order by role;`.
6. **Google consent screen:** Cloud Console → APIs & Services → OAuth consent screen → **Test users
   → add every judge's Gmail** (AUTH_AUDIT §1). Confirm the Authorized redirect URI is
   `https://<ref>.supabase.co/auth/v1/callback` and that Supabase Redirect URLs include your demo
   origin's `/auth/callback` (§3).

**D. Test both roles end-to-end**
7. Sign up / log in with an email that **is** in `staff_directory` → expect `role=lecturer|admin`,
   `status=approved`, correct scoped views.
8. Sign up / log in with an email **not** in the directory → expect `role=student`,
   `status=pending`.
9. (If keeping the `/admin` demo) decide on the §6 BLOCKER: keep the FastAPI port private to your
   machine, or add an auth check to `/admin/*` before showing Governance to anyone.
10. Optional: re-run `python scripts/seed_demo_users.py` so the password-based judge accounts exist
    as a Google-free fallback (AUTH_AUDIT §1).

**E. Roll back if needed**
- Everything from this run is in git (checkpoint commit precedes it) — `git revert` the work commit
  to undo the docs/migration draft. `0006` was never applied, so there is nothing to undo in the DB.

---

## Hard rules honoured this run
- No live-DB writes. No migration applied. Engine (`aegis/`) not modified. `.env`/`.env.local` not
  read. All artifacts reversible and committed.
