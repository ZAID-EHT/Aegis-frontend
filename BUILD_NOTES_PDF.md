# Build Notes — CIPHER 2.0 Documentation PDF

**Produced file (exact name, verified char-for-char):** `CIPHER2_theametuers_Documentation.pdf`
**Throwaway source:** `CIPHER2_theametuers_Documentation.html` (the HTML the PDF was rendered from)
**Build method:** standalone HTML → headless Chrome (`--headless=new --no-pdf-header-footer --print-to-pdf`). UTF-8; no LaTeX.
**Length:** 4 pages (A4). **Status:** unstaged / not committed — left for your review.
**Glyph check (rendered correctly in the PDF):** `Â = L × C`, `≥`, `×`, `→`, `↔`, `≠`, `§` — no mojibake.

---

## Every figure / claim used and its source

| Figure / claim in PDF | Value | Source |
|---|---|---|
| Confidence factors | verified 1.0 / portfolio 0.8 / self-report 0.6 / contradicted 0.5 | `aegis/…/config.py` → `CONFIDENCE` |
| Evidence formula | Â = L × C | `config.py` header + `aegis/api/main.py` (`corrected` flag) |
| STU_08 correction *(demo)* | declared 5.0, contradicted → Â = 5.0 × 0.5 = 2.5; lands in P_05 | **Demonstration scenario** — `aegis/seed/seed.json` (`c05_hero` note + skill entries). STU_08 is a seed-only ID; absent from the live UUID cohort |
| Duplicate gate | cosine ≥ 0.75 | `config.py` → `DEDUPE_THRESHOLD` |
| Duplicate pair *(demo)* | P_02 / P_03 flagged at 0.96 | **Demonstration scenario** — pair in `seed.json` (`duplicate_pair`); 0.96 is the seed-cohort score |
| Duplicate pair *(live)* | near-duplicate pair flagged at 0.911 | **Scale result** — 70-student live cohort /run (your reported value) |
| Matching | Abraham–Manlove SPA, preference-honouring | project design / case material |
| Formation | maximin floor-lifting | engine design / case material |
| Health-band labels *(demo)* | P_04 Healthy / P_01 At-Risk / P_05 Critical | **Demonstration scenario** — `seed.json` (`health_bands` note) |
| Health-band scores *(demo)* | 84 / 69 / 41 | **Demonstration scenario** — 12-student seed run (your reported values; band labels grounded in `seed.json`) |
| Monitoring window | 14-day sprint | `config.py` → `MONITORING_WINDOW_DAYS` |
| Ghosting Tier-3 | 10+ zero-input days | `config.py` → `GHOST_TIER.tier3_days` |
| STU_07 ghost *(demo)* | 0 events / 14 sim-days (P_05) | **Demonstration scenario** — `seed.json` (`ghosting_tier3` note); seed-only ID |
| Sympathy-carry *(demo)* | ≥ 0.95 of another's tasks | `config.py` → `SYMPATHY_RATIO`; **demonstration** case STU_01↔STU_05 in `seed.json` |
| Burnout *(demo)* | utilisation ≥ 2× team avg; STU_01 = 10 events | `config.py` → `BURNOUT_MULT`; **demonstration** `seed.json` (`burnout` note) |
| Cohort headline *(live)* | 70-student cohort → 15 teams + 1 exception pool | **Scale result** — live Supabase /run (your reported values); students keyed by UUID |
| BOLA / RLS / audit / role controls | OWASP API1:2023, 3-tier RLS, hash-chained audit, server-side role | `SECURITY_REVIEW.md` |
| Drive scopes | `drive.file` + `drive.activity.readonly`, OAuth-as-user | `lib/google/auth.ts` → `GOOGLE_SCOPES` |
| Secret hygiene / synthetic data | no secrets in git history; RFC 2606 `@aegis.test` | `PUBLICATION_CHECKLIST.md` |
| LMS default / migration & Drive caveats | C = 0.6 default; non-atomic migrations; consumer-Gmail Drive constraint | Integration Setup Guide + engineering caveats |

## [FIG] placeholders for you to fill — and which run each comes from
All three are full-size dashed boxes on page 3, captioned and sized for drop-in. Per the C1
reconciliation the figures come from **two different runs** — capture each from the run named below:
- **[FIG 1] — 70-student live run (§5.2).** Pipeline stepper — live dashboard (intake → de-dup → match → form → monitor). Its de-dup step should read **0.911**, not 0.96.
- **[FIG 2] — 12-student demonstration run (§5.1).** Team health bands — P_04 Healthy 84, P_01 At-Risk 69, P_05 Critical 41 (engineered seed scores).
- **[FIG 3] — 12-student demonstration run (§5.1).** Alert inbox — STU_07 ghost (Tier-3) + STU_01/STU_05 carry & burnout (seed-only IDs).

To replace: edit the `.figbox` blocks in the HTML (insert an `<img>`), then re-run the Chrome
print command at the top of this file. Do **not** show `lib/sample-run.ts` placeholder numbers
(84/68/42, 0.91, P_A/P_C) — they were deliberately excluded and must not appear.

## Two-run framing (C1 reconciliation — read before trusting any single number)
The PDF separates **two runs**; every number is labeled to one. Do not cross-attribute them:

| | Demonstration scenario (§5.1) | Scale result (§5.2) |
|---|---|---|
| Cohort | 12-student / 8-project engineered seed | 70-student live cohort |
| IDs | STU_01–STU_12, P_01–P_08 (seed-only) | UUIDs (no STU_ IDs) |
| Duplicate score | P_02 / P_03 = **0.96** | near-duplicate pair = **0.911** |
| Teams | 3 full teams, empty exception pool | 15 teams + 1 exception pool |
| Health bands | 84 / 69 / 41 | not separately reported |
| Source of truth | `aegis/seed/seed.json` | live Supabase /run (your reported values) |

Values that come **only** from your live /run and could not be cross-checked against committed
data — confirm against tomorrow's screenshots: **0.911** duplicate, **15 teams + 1 exception pool**.
The demonstration numbers (0.96, 84/69/41, STU_08/STU_07 cases) are all grounded in `seed.json`.

## Note
- A design-lint hook flagged the formula callout's left accent border (`.formula`, line 28). Left
  intentionally — it's a conventional print formula/quote rule, not a UI card; classified as a false
  positive. No ignore directive was persisted.
- No working code was touched this gate. Only `CIPHER2_theametuers_Documentation.{html,pdf}` and this file were created.
