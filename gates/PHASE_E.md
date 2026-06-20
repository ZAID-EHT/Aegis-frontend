# Gate report — Phase E · Governance (stretch)

**Status:** ✅ complete · audits green · database-reviewer (×2) + python/silent-failure reviewers run, all BLOCKING fixed
**Date:** 2026-06-21

## What was built
### SQL — `supabase/migrations/`
- **`0001_base_schema.sql` (new):** the core relational model (profiles, lecturer_cohorts,
  students, projects, skills_declared, teams, team_members, tasks, activity_log, alerts) with
  **RLS enabled + default-deny on every table** (SECURITY_REVIEW C2). Role escalation closed by a
  **BEFORE UPDATE trigger** (`enforce_role_immutable`, compares OLD/NEW — the correct place, since
  RLS WITH CHECK can't see OLD) (C3). Cohort/team scoping policies (H1). `is_admin()` SECURITY
  DEFINER with pinned `search_path`. Indexes on every RLS-join column.
- **`0002_governance.sql` (hardened):** hash-chained append-only `audit_log` + `audit_verify()`,
  enforcement triggers (override-requires-reason, admin-only role change, grant mirroring).

### Offline mirror — `aegis/governance/`
- `audit.py`: pure hash-chain (`build_chain` / `verify`) mirroring the SQL — so the prototype's
  integrity badge is a **real, tamper-detectable** feature offline. Digest is structured JSON
  (injection-resistant) covering every field incl. id/actor_role/target_type.
- `governance.json` seed with **stored** prev_hash/row_hash; `repo_governance` loads them (doesn't
  re-chain), so tampering the seed file is actually caught.

### API + admin console
- `GET /admin/audit | /approvals | /overrides | /integrity` over the governance data.
- `app/admin/page.tsx`: integrity badge (green verified / red tampered), pending approvals,
  override-watch, hash-linked audit stream. Sidebar nav wired between dashboard and admin.

## Verification
```
ruff check aegis → All checks passed!
mypy aegis       → no issues in 33 source files
pytest -q        → 83 passed (10 governance/admin tests incl. tamper, reorder, forged-hash,
                   delimiter-collision, seed-file-tamper, empty-not-verified)
tsc + eslint     → clean (admin page)
live uvicorn     → GET /admin/integrity -> {verified:true, entries:6}
```
⚠️ **SQL could not be executed** (no `psql`; Docker Desktop's Linux engine is not running). Both
migrations were instead reviewed logically by the database-reviewer **twice**; apply-order and the
hash formula were confirmed. Recommend a real `supabase db reset` before submission.

## Reviewers — findings fixed
Three reviewers, then a second database pass. All BLOCKING resolved:
- **SQL:** `service_role` writes crashed on `audit_log.actor_id NOT NULL` (NULL auth.uid()) → system
  sentinel actor. Fragile C3 RLS subquery → BEFORE UPDATE trigger. Missing `search_path` on all 6
  DEFINER functions → pinned. `created_at::text` timezone-fragile → canonical UTC `to_char`. Chain
  fork under concurrent inserts → advisory lock. Digest omitted id/actor_role/target_type → added.
  Missing RLS-join indexes → added. `enforce_role_immutable` was blocking service_role → guarded
  with `auth.uid() is not null` (caught by the 2nd review).
- **Python:** digest was delimiter-forgeable and omitted id/actor_role/target_type → structured JSON
  over all fields. `/admin/integrity` re-chained on load (couldn't detect seed tampering) →
  loads stored hashes. `verify([])`/empty log showed green → empty is now "not verified". Added
  tests for every tamper class.

## Documented limitations (production hardening, not built)
- Migrations unexecuted locally (no Postgres) — verify with `supabase db reset` / a live project.
- Revocations (`access_grants.revoked_*`) not yet audited (insert-only trigger); add an update trigger.
- Backend-level governed actions (login, allocation_run, appeal_decided, data_exported) are logged
  explicitly by the backend with service_role, per 0002's note — not by triggers.
- The Python audit mirror is the offline demo layer; the SQL spine is the production enforcement.

## Build status
**Phases 0 → A → B → C → D → E all complete.** Engine spine (55 marks) golden-tested end-to-end;
FastAPI + Next.js dashboard; governance schema + admin console. 83 tests green; audit hook clean.
