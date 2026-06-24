# WORKSPACE_GAP.md — Drive workspace: what exists, the gap, the minimal demo fix

**Pass type:** AUDIT + SCOPE ONLY. Nothing changed. Engine + admin governance path untouched. 0006 unapplied.
**Verified in code (not assumed).** File:line references below.

---

## TL;DR
The **backend is real**: provisioning creates a folder + 3 Google Docs and **persists `teams.drive_folder_id`**; polling reads Drive Activity into `activity_log`. The **gap is the front of the pipe and the last mile**: (1) **no UI** anywhere lets a student (or lecturer) open a workspace, (2) the API **doesn't expose `drive_folder_id`** to the client, (3) **no team has a folder provisioned yet**, and (4) the live Drive→health loop is **built but inert** on the personal-account path — health is computed from **seeded** `activity_log`, not live Drive. → This is case **(d), a combination** (details in Part 2).

---

## PART 1 — What EXISTS (file:line)

### Backend — provisioning ✅ works and IS wired to teams
- `app/api/drive/provision/route.ts` — `POST`, **admin-only** (`requireAdmin()` → `lib/google/guard.ts:14-19`, checks authoritative `profiles.role='admin'`). Takes `{ teamId }`, pulls member emails from `team_members`, calls `provisionTeamWorkspace(teamId, emails)`. Returns `{ ok, ...workspace }`. **No UI calls this** — it's a manual POST only.
- `lib/google/drive.ts:25-74` `provisionTeamWorkspace`:
  - Creates the team folder under `AEGIS_ROOT_FOLDER_ID` (`:29-44`) — **requires** that env var + Google creds, else throws (`:30-32`).
  - Creates the 3 Google Docs — Project Report (Doc), Task Tracker (Sheet), Presentation (Slides) (`WORKSPACE_FILES :6-10`, created `:46-54`).
  - Grants each member `writer` on the folder (`:58-64`).
  - **Persists `teams.drive_folder_id = folderId` (`:66-71`)** ← so provisioning *is* wired to the team row (corrects the earlier "not wired" suspicion).
  - **Auth:** `lib/google/auth.ts` prefers `GOOGLE_OAUTH_REFRESH_TOKEN` (OAuth-as-user, needed for consumer Gmail) else a service account.

### Backend — polling ✅ exists, ⚠️ inert for health on the personal path
- `app/api/drive/poll/route.ts` — `POST`, **shared-secret** (`x-poll-secret` vs `DRIVE_POLL_SECRET`, `:16-19`) for schedulers (not a user session). Selects teams **where `drive_folder_id is not null`** (`:22-25`) and polls each.
- `lib/google/activity.ts:28-114` `pollTeamActivity`:
  - Queries the **Drive Activity API** by `ancestorName: items/<folderId>` since the last cursor (`:62-68`, cursor in `drive_sync_state` `:36-41,106-111`).
  - **Writes to `activity_log`** (`student_id, file_id, action, event_type, ts` — `:91-98`). **This is the table that feeds health.**
  - ⚠️ **Attribution caveat (`:21-27, 79-89`):** Drive Activity returns actors as `people/ID`, not email; the personal-folder share path can't resolve that to a student, so **most events are `skippedUnattributed`** and never inserted. So live polling produces ~no attributed rows on the prototype path.

### Engine — health is computed from SEED activity, not Drive
- `aegis/engine/phase_c_health.py:5-6` (docstring, verbatim): *"Everything here reads the seeded `activity_log` (and per-team `monitoring`) — no live Drive."*
- `health_report()` (`:67-94`) = 4 components: `engagement` (`_engagement :43-48`) + `workload_balance` (`_workload_balance :51-56`), both from `cohort.activity_log`; plus `task_completion` / `milestone` from `cohort.monitoring` (= `team_monitoring` table). Ghosting/carry/burnout (`:106-201`) likewise read `cohort.activity_log`.
- The adapter `aegis/adapters/repo_db.py` `load_db_cohort` loads `activity_log` + `team_monitoring` from Supabase into the `Cohort`. **The engine never calls Drive.** Drive can only influence health *transitively*: `poll → activity_log → adapter → engine`. With polling inert (above) and the live cohort's `activity_log` bulk-seeded, **today's health = seeded behaviour**.

### Frontend — NO workspace UI, and the field isn't even exposed
- `grep drive_folder_id` → appears **only** in `supabase/migrations/0005_drive_workspace.sql`, `lib/google/drive.ts`, `app/api/drive/poll/route.ts`, and docs. **Not** in `aegis/api/main.py` (the `/run` `TeamView`, `:116-125`), **not** in `lib/api.ts` (`TeamView`, `:31-40`), **not** in any page/component.
  → **The `/run` and `/teams` responses do not include the folder id**, so the client literally doesn't have a URL to link to.
- No `"Open workspace"` / `"Create workspace"` / Drive link in any page or component (the `"workspace"` string hits are the student **"My workspace"** view title, not Drive).
- **How a student reaches their Drive workspace today: they can't.** No link is rendered, and the folder id isn't in the data the frontend receives.

---

## PART 2 — The gap, precisely: **(d) a combination**

| Sub-claim | Status |
|---|---|
| (a) Only the frontend link is missing | **True** — no UI anywhere, on student/team/admin. |
| (b) Provisioning isn't wired to teams | **False** — `drive.ts:66-71` persists `teams.drive_folder_id`. |
| (c) Drive→health loop is aspirational; health is from seed | **True in practice** — loop is *built* (poll→activity_log) but **inert** on the personal-account path (attribution skips events); health is computed from seeded `activity_log`/`team_monitoring` (`phase_c_health.py:5-6`). |
| **Plus** | The API **doesn't expose `drive_folder_id`**; and **no team has a folder provisioned** (the live 70-cohort was bulk-loaded, and `/api/drive/provision` has no UI trigger and needs Google creds). |

**So:** the machinery exists, but a student can't open a workspace because there's **no UI link**, **no folder id in the API response**, and **probably no folder provisioned**. The live activity→health feedback is real code but doesn't currently feed live signal.

> **One thing to verify (1-row live read, not done here):** `select id, drive_folder_id from teams where drive_folder_id is not null;` — expected: **none**. If any exist, Option A below shrinks.

---

## PART 3 — Minimal demo-ready fix (1-day budget, seed data acceptable)

The honest demo story to aim for: **"the workspace is provisioned and openable; engagement/workload/health run on representative seed activity; live Drive-activity ingestion is built and is the production path (it needs Google Workspace + a Shared Drive to resolve actor identity, deferred)."**

### Option B — RECOMMENDED for the demo (smallest, no live DB / engine / admin-path touch)
A visible **"Open workspace"** button that opens a **real, pre-created demo Google folder**, wired by config — no provisioning run, no API change, no DB write.
1. You create **one** Google Drive folder (or reuse `AEGIS_ROOT_FOLDER_ID`), put the 3 Docs in it, share it so judges can open it.
2. Add `NEXT_PUBLIC_DEMO_WORKSPACE_URL=<folder url>` to `.env.local`.
3. Render an **"Open workspace"** button:
   - Student view: `components/student-workspace.tsx` (in the team card).
   - Lecturer/admin: `components/dashboard.tsx` `TeamCard` (a per-team "Open workspace" link).
   The button links to `process.env.NEXT_PUBLIC_DEMO_WORKSPACE_URL` (opens in a new tab).
- **Files:** `components/student-workspace.tsx`, `components/dashboard.tsx`, `.env.local` (you). **Effort: S (~1–2h).** **Engine: no. Live DB: no. Admin path: no. Google API: no.**
- **Trade-off:** every team links to the same demo folder (fine for a single-workspace demo); per-team folders are Option A.

### Option A — Authentic per-team (fuller; touches live DB + API + Google)
Real provisioned folder per demo team, linked individually.
1. **[LIVE-TOUCH + Google]** Ensure `AEGIS_ROOT_FOLDER_ID` + `GOOGLE_OAUTH_REFRESH_TOKEN` are set; as admin, `POST /api/drive/provision { teamId }` for the 2–3 demo teams → creates folders/Docs, persists `teams.drive_folder_id`. *(Writes live DB + creates Drive files — apply watching.)*
2. **Expose the field:** add `drive_folder_id` to the `/run`/`/teams` response — `aegis/api/main.py` `TeamView` (`:116-125`) + `repo_db.load_db_cohort`/`_team_views` mapping, and `lib/api.ts` `TeamView` (`:31-40`). *(API layer, **not** engine logic, **not** the `/admin/*` path.)*
3. Render the per-team link from `team.drive_folder_id` → `https://drive.google.com/drive/folders/<id>` in the same two components as B.
- **Files:** `aegis/api/main.py`, `aegis/adapters/repo_db.py`, `lib/api.ts`, `components/student-workspace.tsx`, `components/dashboard.tsx`; **[LIVE]** provision calls. **Effort: M (~½ day).** **Engine: no. Live DB: yes (provision writes). Admin path: no.**
- **Risk a day out:** Google creds/quota + live writes + an API-shape change. Higher than B.

### On the activity→health loop (be honest)
Wiring **live** Drive activity into health in the remaining time is **not realistic** — the attribution blocker (`activity.ts:21-27`) needs Google Workspace + a Shared Drive (domain-wide delegation) to resolve actor→student, which the personal-Gmail path doesn't grant. **Recommend:** keep health on **representative seed activity** (already working and demonstrable), present the live ingestion as the built-but-deferred production path, and make the workspace **openable** (Option B). This is already noted in §6 / backlog (Drive polling auth).

---

## Recommendation
**Do Option B.** It makes the workspace genuinely **accessible and demonstrable** (student and lecturer can open the live Google Docs workspace) within the 1-day budget, with **zero** engine/live-DB/admin-path risk, and a truthful demo narrative. Reach for Option A only if Google creds are already configured and you're comfortable provisioning live while watching.

**STOP** — audit + scope only; nothing changed. Tell me **B** (and I'll need the folder URL / env var) or **A**, and I'll implement with the verify-after protocol.
