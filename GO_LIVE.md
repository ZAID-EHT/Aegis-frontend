# GO_LIVE.md — pre-flight result + the exact ordered actions for your session

Read-only pre-flight done. **Nothing live was touched.** This file is the single ordered action
list for your capture + apply + demo session. Run it top to bottom.

---

## Pre-flight status (verified just now — all green)

- **Git:** working tree clean; HEAD = `35edec1` (checkpoint `871921a` precedes this work).
  Last 3: `35edec1` live-capture prep · `871921a` checkpoint · `abde57c` pre-demo pass.
- **Untracked `scripts/seed_demo_users.py`:** contains **no real emails or secrets** — the 3
  addresses are all `@aegis.test` (synthetic/RFC 2606); the only credentials are throwaway
  demo-account passwords (`AegisJudge-*-2026`) for those synthetic accounts; `SUPABASE_URL` /
  `SERVICE_ROLE_KEY` are read from env, never hard-coded. → **Safe to commit as-is.** Optional:
  if you'd rather keep even demo passwords out of the public repo, `git`-ignore it before push
  (it does **not** trip the "real emails" rule, so this is your call, not a blocker).
- **Deliverables present & committed:** `CAPTURE_SESSION.md`, `AUTH_AUDIT.md`, `NEXT_STEPS.md`,
  `supabase/migrations/0006_staff_directory.sql` — no uncommitted drift.
- **0006 invariants (eyeballed):** (a) role sourced **only** from the `staff_directory` email
  lookup or hard-coded `'student'` default — `raw_user_meta_data` never consulted; (b)
  `staff_directory` is **admin/service_role write-only** (RLS default-deny + single `is_admin()`
  policy). Both confirmed.

---

## STEP 1 — Live capture (eyes on the system) → drive with `CAPTURE_SESSION.md`
1. Start backend with `$env:SUPABASE_URL` set (`uvicorn`) + frontend (`pnpm dev`).
2. Confirm **live cohort = student count 70** (no "adapter active" log exists — use the count).
3. `/run` and verify: duplicate cosine **= 0.911** (flag if shifted), **15 teams + 1 exception
   pool**, and record the **health-band distribution** (`$r.teams | Group-Object band`).
4. Capture **FIG 1 (pipeline stepper) from LIVE**; restart uvicorn **without** `SUPABASE_URL`
   (seed = 12), then capture **FIG 2 (84/69/41)** and **FIG 3 (STU_07 + STU_01/STU_05)** from SEED.

## STEP 2 — Fill bands + re-render
5. Drop the live distribution into HTML **§5.2** and the `BUILD_NOTES_PDF.md` framing table
   ("not separately reported" cell). Leave §5.1's 84/69/41 as seed.
6. Insert the 3 PNGs into the `.figbox` blocks; re-render the PDF (command in `BUILD_NOTES_PDF.md`).
7. If live cosine ≠ 0.911, update §2.2/§5.2 + framing table to the real number — don't keep 0.911.

## STEP 3 — Apply auth (the gate; review header first)
8. Read the **BEFORE-YOU-APPLY** header in `0006_staff_directory.sql`; confirm your live `profiles`
   columns match the INSERT list. Apply `0006` to **non-prod first**, then live.
9. Seed staff: copy `staff_directory_seed.example.sql` → `staff_directory_seed.local.sql`
   (gitignored), real lecturer/admin emails in, run it.

---

## STEP 4 — T-minus-30 pre-demo checklist (run 30 min before the panel)

> Consolidated from `AUTH_AUDIT.md` §1/§3/§6. Tick every box before judges arrive.

- [ ] **Redirect URIs match the demo URL.** Google login client → Authorized redirect URI =
      `https://<ref>.supabase.co/auth/v1/callback`. Supabase → Auth → URL Config → **Redirect URLs**
      includes the **exact** origin you'll present from (`http://localhost:3000/auth/callback` *or*
      the deployed `https://…/auth/callback` — `localhost` ≠ `127.0.0.1`). (AUTH_AUDIT §3)
- [ ] **Every judge email is in BOTH places:** Google consent screen → **Test users** *and*
      `staff_directory` (with the right `lecturer`/`admin` role). Missing from Test users = "access
      blocked", the #1 killer. (AUTH_AUDIT §1, §6)
- [ ] **Fresh incognito login works end-to-end — both roles:**
      - one **supervisor/lecturer** email → lands `lecturer` + `approved`, sees cohort-scoped views;
      - one **student** email (not in directory) → lands `student` + `pending`.
- [ ] **Two known-good fallback accounts you control (one of each role):** the seeded
      `judge.lecturer@aegis.test` / `judge.admin@aegis.test` (password login via
      `scripts/seed_demo_users.py`) — these skip Google entirely, so they work even if the consent
      screen misbehaves. Confirm you can log into both right now.
- [ ] **Brief the judges** on the "Google hasn't verified this app → Advanced → Continue" click,
      or just lead with the password fallback accounts. (AUTH_AUDIT §2)
- [ ] **`/admin` API exposure:** the FastAPI `/admin/*` endpoints are unauthenticated — keep that
      port private to your machine during the demo, or don't surface Governance to non-admins.
      (AUTH_AUDIT §6 BLOCKER)

## STEP 5 — Final commit + push
10. Commit filled docs + re-rendered PDF + 3 figures. `git push`.
11. Before push, confirm nothing sensitive is staged: `.env*` and `*_seed.local.sql` are gitignored;
    decide on `scripts/seed_demo_users.py` per the pre-flight note above.

---

*Pre-flight changed nothing. The live capture, the `0006` apply, and the login tests are yours to
run with eyes on the system.*
