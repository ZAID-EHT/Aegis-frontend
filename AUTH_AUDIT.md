# AEGIS — Auth Audit (Google OAuth login → session → role → routing)

**Scope:** read-only trace of the full login path for demo day. No code or config was changed
to produce this report. Findings are graded **[BLOCKER]** (judges can't log in / can't see their
view), **[RISK]** (security or correctness gap), **[OK]** (working as intended), and
**[VERIFY]** (lives in a dashboard/`.env` I can't read from the repo — you must confirm).

Generated for the autonomous pre-demo pass. Nothing here touches the live DB or live auth.

---

## 0 · The path in one diagram

```
[Login page]  GoogleButton.signInWithOAuth({provider:'google',
                redirectTo: `${origin}/auth/callback?next=/dashboard`})
      │  (browser → Google consent)                         lib client (anon key)
      ▼
[Google OAuth client]  ── registered in Supabase Auth → Providers → Google
      │  (Google → Supabase callback)
      ▼
https://<ref>.supabase.co/auth/v1/callback   ← Google "Authorized redirect URI"
      │  (Supabase mints code, redirects to app)
      ▼
[/auth/callback/route.ts]  exchangeCodeForSession(code) → redirect to `next` (/dashboard)
      │  on error → /login?error=link
      ▼
[middleware.ts]  getUser() refreshes session cookie; gates PROTECTED routes
      │
      ▼
[profiles row]  created by handle_new_user() trigger on auth.users
                role hard-forced 'student', status 'pending'   (0004)
      │
      ▼
[UI role]  user-provider.toUser() reads user_metadata.role  ← NOT profiles.role
[DB role]  RLS / is_admin() read profiles.role               ← authoritative
```

> **Two Google clients, don't conflate them.** The **login** client lives in Supabase
> (Authentication → Providers → Google). The **Drive** client (`lib/google/auth.ts`,
> `GOOGLE_OAUTH_*`) is a *separate* Desktop client for workspace provisioning. `.env.example`
> line 33–34 says this explicitly. Everything in this audit is about the **login** client.

---

## 1 · Consent screen in "Testing" mode → only allowlisted users can log in  **[BLOCKER if unset]**

If the login OAuth client's consent screen **publishing status = Testing**, Google allows the
OAuth grant **only for emails on the Test users list**. A judge whose Gmail isn't listed gets
**"Access blocked: AEGIS has not completed the Google verification process"** and cannot reach
Supabase at all — the session is never created.

**How judge emails get added — exact path:**
1. Google Cloud Console → select the project that owns the **login** OAuth client.
2. **APIs & Services → OAuth consent screen**.
3. Scroll to **Test users → + ADD USERS**.
4. Add each judge's **Google account email** (must be the exact Gmail/Workspace address they
   sign in with), one per line. Save.
5. Limit is **100 test users**; additions take effect immediately (no re-verification).

**Decision for demo day — pick one:**
- **(A) Stay in Testing + allowlist** (recommended, lowest risk): collect judge Gmail addresses
  ahead of time, add them as Test users. Pro: no verification, no scary interstitial caveats.
  Con: you must know the emails in advance.
- **(B) Publish to Production**: removes the allowlist, but with sensitive scopes Google may
  require full verification (days–weeks). For **login-only** scopes (`email`, `profile`,
  `openid` — non-sensitive) you can publish without verification and anyone can log in. Confirm
  the login client requests *only* those non-sensitive scopes before choosing this.

**[VERIFY]** I cannot read the Cloud Console from the repo. Confirm: (a) publishing status,
(b) that the test-user list contains every judge email, (c) the login client's scope list.

**Fallback that sidesteps Google entirely:** the seeded demo accounts
(`scripts/seed_demo_users.py`) are **email+password** judge logins
(`judge.student|lecturer|admin@aegis.test`). These do **not** touch Google OAuth, so they work
regardless of consent-screen state. Treat them as the primary demo path and Google as a bonus.

---

## 2 · "Google hasn't verified this app" interstitial  **[RISK — UX]**

In **Testing** mode (or Production-unverified), an allowlisted judge still sees a warning screen:
**"Google hasn't verified this app."** It is not a dead end:

- Click **Advanced** → **Go to AEGIS (unsafe)** → continue → normal consent → redirect back.
- For pure login scopes (`email`/`profile`) this screen is low-risk and expected for student
  projects. **Brief the judges**: "you'll see an unverified-app screen — click Advanced, then
  continue; it's our capstone app, not published to Google."
- To avoid it entirely, use the **email+password demo accounts** (§1 fallback) — no Google screen.

**Recommendation:** put one line in the judge handout describing the Advanced→Continue click,
and lead with the password accounts so a nervous judge never has to make that choice live.

---

## 3 · redirect_uri / authorized origins  **[BLOCKER if mismatched]**

The app calls `signInWithOAuth({ redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` })`
— **origin is dynamic**, taken from wherever the browser is (localhost, deployed URL, or IP).
Two separate allowlists must both contain the right values or login dead-ends:

**(a) Google OAuth client — Authorized redirect URIs** (Cloud Console → Credentials → the login
client). Must contain Supabase's callback, **not** the app URL:
```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

**(b) Supabase Auth → URL Configuration** (Supabase dashboard):
- **Site URL** = the canonical demo origin.
- **Redirect URLs** allowlist must include the `/auth/callback` of **every origin you might demo from**:
  ```
  http://localhost:3000/auth/callback
  https://<your-deployed-domain>/auth/callback
  http://<lan-ip>:3000/auth/callback        # only if demoing over a LAN IP
  ```
  If the running origin's `/auth/callback` isn't allowlisted, Supabase silently falls back to
  Site URL and the user lands on the wrong place (or `?error=link`).

**Demo-URL match checklist:**
- Demoing on **localhost** → ensure `http://localhost:3000/auth/callback` is in Supabase Redirect URLs.
  Note: `localhost` and `127.0.0.1` are **different origins** — pick one and be consistent.
- Demoing on a **deployed** URL (Vercel etc.) → that exact https origin must be Site URL or in Redirect URLs.
- Demoing over an **IP** → add that IP origin; Google login over a bare IP is awkward — prefer
  localhost or the deployed domain.

**[VERIFY]** The actual registered URIs live in the Google + Supabase dashboards (not in the
repo). `NEXT_PUBLIC_SUPABASE_URL` in your `.env.local` gives `<project-ref>`; confirm both
allowlists against the origin you will actually present from.

---

## 4 · First-login race — is the profile row + role there before the app reads it?  **[OK, with one VERIFY]**

- `handle_new_user()` (migration `0004`) runs as a trigger **on `auth.users`** and inserts the
  `profiles` row **inside the signup transaction** (AFTER INSERT). By the time Supabase issues a
  session, the row exists — so there is no "logged in but no profile" window under normal operation.
- The app barely depends on this on the client: the **dashboard reads engine data from FastAPI**,
  not `profiles`. Role-dependent DB reads go through RLS, and `is_admin()` **fails safe** — a
  missing/absent profile row makes `is_admin()` return `false` (no escalation, no crash). Worst
  case a brand-new user is briefly treated as a non-admin, not shown an error page.
- **No blank/error redirect** is triggered by the race itself. The callback only redirects to
  `/login?error=link` when `exchangeCodeForSession` fails (bad/expired code), which is unrelated.

**[VERIFY — important]** The `create trigger ... on auth.users execute handle_new_user()` binding
is **not present in any tracked migration** (`0001`–`0005`). `0004` redefines the *function* and
notes "the trigger on auth.users is untouched", i.e. it already exists in your **live** DB only.
Consequence: if the DB were ever rebuilt from migrations alone, **no profile rows would be
created** and the whole approval/role system would silently break (empty admin panel, every
`is_admin()` false). Confirm the trigger exists in the live project:
```sql
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
```
Migration `0006` (drafted) re-asserts this trigger idempotently so it stops being live-only.

---

## 5 · Session persistence across refresh / new tab  **[OK]**

- `middleware.ts` calls `supabase.auth.getUser()` on every matched request and **re-writes the
  session cookies** on the response (the SSR cookie dance). The code comment correctly warns not
  to run logic between `getUser()` and returning `response`. This refreshes the access token, so
  **a page refresh keeps the session**.
- The browser client (`@supabase/ssr` `createBrowserClient`) persists the session in cookies, so
  a **new tab** on the same origin is already authenticated.
- `UserProvider` subscribes to `onAuthStateChange`, so client-side nav keeps the user live without
  refetching.
- **Matcher caveat:** `middleware.ts` `config.matcher` excludes `_next/static`, images, etc. —
  fine. Just note the cookie only refreshes on requests that *hit* middleware; a tab left idle past
  token expiry refreshes on its next navigation/refresh, which is the normal Supabase behaviour.
- **Sign-out** (`user-provider.signOut`) calls `supabase.auth.signOut()` then hard-navigates to
  `/login` — clean.

---

## 6 · Current role routing — what each role sees, and the gaps

**What's enforced where:**
- **Route gate (`middleware.ts`):** `PROTECTED = /dashboard /teams /alerts /pipeline /admin`.
  Redirects **unauthenticated** users to `/login?redirect=…`; bounces authenticated users off
  `/login`/`/signup`. **This is an authentication gate only — it does NOT check role or status.**
- **Authoritative role:** `profiles.role` (`student|lecturer|admin`), hard-forced to `student`
  at signup, changeable only by an admin or the service_role backend (enforced by the
  `enforce_role_immutable` BEFORE-UPDATE trigger, `0001`). Self-assignment is genuinely blocked.
- **Data scoping:** RLS in `0001` scopes students/skills/teams/alerts to the member, their
  lecturer's cohort, or admin. This part is solid for **direct Supabase reads**.

**Gaps (graded):**

- **[BLOCKER — role] `/admin` is reachable by any logged-in user, AND the admin API is
  unauthenticated.** `middleware.ts` lets any authenticated user open `/admin`. The page then
  calls FastAPI (`lib/api.ts` → `NEXT_PUBLIC_API_URL`) endpoints `/admin/audit`,
  `/admin/approvals`, `/admin/overrides`, `/admin/integrity`, and `POST /admin/approvals/{id}`.
  In `aegis/api/main.py` these handlers have **no `Depends` auth, no Authorization header is sent
  by the client, and no JWT is verified** — they run on the **service_role** backend. Net effect:
  **anyone who can reach the API URL can read the full governance/audit data and approve or reject
  accounts**, regardless of their role. This is the single most important finding. *(Reported
  only — `aegis/` was not modified per the run constraints.)*
  - *Mitigations for demo:* keep `NEXT_PUBLIC_API_URL` pointed at a backend only you run; do not
    expose the FastAPI port publicly; or add a bearer check on `/admin/*` before any public demo.

- **[RISK — cosmetic] Sidebar role label is spoofable but grants nothing.** `user-provider.toUser()`
  derives the displayed role from **`user_metadata.role`**, which on the email-signup path comes
  straight from client-supplied `options.data.role` (`signup/page.tsx` lets a user pick
  student/supervisor). A user could set metadata role to `admin` and the sidebar would *say*
  "admin" — but **every real check uses `profiles.role`/`is_admin()`**, so no data access follows.
  Google logins have no `user_metadata.role` → label shows **"Member"**. Cosmetic only; worth
  knowing so a judge isn't confused.

- **[RISK — UX] Nav is not role-filtered.** `app-shell.tsx` `NAV` is static — **every** user sees
  the **Governance** (admin) item. A student clicking it loads `/admin`, whose API reads currently
  succeed (see the BLOCKER) or, if the API gate were added, would error. Either way it's a
  confusing surface for non-admins. Consider hiding `settings`/Governance unless `profiles.role`
  is admin.

- **[RISK — approval not enforced] `status='pending'` is messaged but not gated.** New signups get
  `status='pending'` and the signup screen says "reviewed by a supervisor before access is
  granted" — but `middleware.ts` only checks that a `user` exists, **not** that status is
  `approved`. A pending user (incl. a fresh Google judge) can still browse `/dashboard` (which
  shows the FastAPI engine demo). Fine for a demo, but the approval control is half-wired: the DB
  tracks status, the router ignores it.

- **[OK] supervisor/lecturer terminology drift.** The signup dropdown offers "Supervisor" but the
  role enum is `lecturer`; since `handle_new_user` discards the client role anyway (forces
  `student`), this mismatch is harmless today. It would matter only if a future path trusted the
  signup role — don't.

**Effective "what each role sees" today (via the demo accounts):**
| Role (`profiles.role`) | Dashboard / Teams / Alerts / Pipeline | Governance (`/admin`) data | Approve/reject |
|---|---|---|---|
| student | yes (engine demo + RLS-scoped DB) | **page opens; API currently returns data (BLOCKER)** | **currently yes (BLOCKER)** |
| lecturer | yes, scoped to assigned cohort (RLS) | same as above | same |
| admin | yes, all cohorts | intended audience | intended |

Once the `/admin/*` API gets a real auth/role check, this table collapses to the intended
"admin-only governance" — until then, treat the governance panel as **not access-controlled**.

---

## 7 · Pre-demo quick checklist (login only)

- [ ] **[VERIFY]** Login OAuth consent screen: judges' emails on Test users **or** published with
      non-sensitive scopes (§1).
- [ ] **[VERIFY]** Google client Authorized redirect URI = `https://<ref>.supabase.co/auth/v1/callback` (§3a).
- [ ] **[VERIFY]** Supabase Redirect URLs include the **exact** demo origin's `/auth/callback` (§3b).
- [ ] **[VERIFY]** `on auth.users` trigger for `handle_new_user` exists in live (§4).
- [ ] Brief judges on the unverified-app **Advanced → Continue** click (§2), or lead with the
      **email+password** demo accounts (§1 fallback) to skip Google entirely.
- [ ] Decide before showing the **Governance** tab to anyone: the `/admin/*` API is currently
      unauthenticated (§6 BLOCKER) — keep the API private or add a check.

*All items above are dashboard/config or backend-code actions for the human operator. This audit
changed nothing.*
