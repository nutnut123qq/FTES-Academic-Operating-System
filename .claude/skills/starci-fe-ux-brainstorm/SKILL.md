---
name: starci-fe-ux-brainstorm
description: >
  Brainstorm 1–3 new layouts for a StarCi Academy page, then draw widget mockups for the user to choose.
  Step 1 of the self-learning loop. It READS the house's decision memory — `decision/<block>.md`
  (why we chose & shaped each block), `design/CONTENT.md` (page-level UX decisions + UX lessons),
  `cannon/CONTENT.md` (code rules) — and FETCHES fresh course-website UX from the web (WebSearch/WebFetch),
  then proposes 1–3 layouts (components, functionality, optional MINOR backend delta) + renders widget
  mockups. The user picks → `/starci-fe-ux-apply` builds it and records the decisions. NO production code.
  Run with MAX effort (Opus). Trigger on `/starci-fe-ux-brainstorm`, "đề xuất layout", "brainstorm trang",
  "thiết kế lại trang", "design layout", "bố cục trang", "nghĩ ux".
---

# /starci-fe-ux-brainstorm — propose layouts from the house decision memory + live web refs (Opus · MAX)

Step 1 of the loop: `BRAINSTORM → (pick + feedback) → /starci-fe-ux-apply` (apply writes the decisions into
the journals at the end — no separate merge command). `<src>` = the FE app (`D:/Repositories/starci-academy`);
skill-relative paths are `../../decision`, `../../design`, `../../ui`, `../../cannon`. This skill **does NOT write code** — it reads,
fetches, proposes, draws widgets.

## 1. Read the house knowledge (it grows every loop)
- **`../../decision/<block>.md`** — WHY we chose & shaped each block (card, sidebar, tabs, chip,
  stat…). Open the ones relevant to the page; `../../decision/CONTENT.md` is the index. **Reuse the
  house's logic — don't re-decide.**
- **`../../design/CONTENT.md`** — page-level UX: layout foundations (archetypes, 3-tier law) + UX
  pattern lessons already captured.
- **`../../ui/CONTENT.md`** — the visual system: tokens, accent teal `#00a898`, spacing scale,
  typography — so the proposal looks like StarCi.
- **`../../cannon/CONTENT.md`** — FE code rules, so every proposal is buildable (blocks props-only, features
  data-owner).

## 2. Fetch fresh UX from the web (live)
For the page's job (catalog · lesson player · gamification · onboarding · paywall · dashboard), use
**WebSearch/WebFetch** to pull CURRENT UX from the relevant learning platforms (table in
`../../design/CONTENT.md`: Coursera, Udemy, Duolingo, Khan, Brilliant, Codecademy, edX…). Lift what they
do well; note what NOT to copy. (Apply will append the durable takeaway to `design/` at the end.)

## 3. Read the page's current source
Route (`app/[locale]/…/page.tsx`) + the feature/blocks rendering it + the data it shows (GraphQL op in
`modules/api`/`hooks/swr` + Postgres entity — fields the BE exposes but the UI ignores = opportunity).

## 3b. Read the BACKEND deeply — understand thầy's business (MANDATORY, cache it)
The FE is only the surface; the real **business rules live in the backend** (`D:/Repositories/starci-academy-backend`).
You CANNOT design the right UX without knowing what the domain actually does — what persists, what's
gated, what's per-user vs per-course vs per-milestone, what a "submission/attempt/credit/unlock" really
means. **Always trace the page's data to its backend source before brainstorming:**
- **GraphQL resolver** for each op the page calls (`apps|src/**/<domain>.resolver.ts`) → the **service**
  it delegates to (`*.service.ts` / CQRS handlers) → the **entity/migrations** (TypeORM `*.entity.ts`,
  columns, relations, defaults) → any **enum/state machine** (statuses, lock/unlock, scoring, phases).
- Answer the biz questions the layout depends on, e.g.: *what is the scope of this record* (per-task vs
  per-milestone vs per-project vs per-user)? *what persists across navigation*? *what unlocks the next
  step*? *what does the score/credit/quota mean*? *which fields are write-once / server-derived*?
  A wrong assumption here (e.g. "submission is per-task" when it's **per-project, persisted across every
  milestone**) produces a structurally wrong layout.
- **Cache the findings** so the next loop starts smart: append a distilled **"Backend business" note** for
  the page to its `design/<page>.md` (scope, persistence, gating, scoring, key fields + the resolver→
  service→entity path you traced). On later runs, **read that cache first**; only re-read BE source when
  the cache looks stale or the page touches a new domain. Treat the BE source as the source of truth, the
  cache as the fast path — never brainstorm from FE shapes alone.

## 4. Brainstorm 1–3 layouts
Each direction: anchored to a **recorded decision** (`decision/<block>.md`) + a **fetched ref** + an archetype.
- **components** — reuse StarCi blocks; propose a NEW block if needed (name its API + tier, per cannon).
- **functionality** — new interactions the layout enables.
- **⚙️ minor BE delta (propose only):** if the layout needs data the BE doesn't expose, propose a small
  GraphQL field/query/projection. Scope small. Never write BE here.
- section → data table; empty/loading/error + a11y + dark mode from the start.

## 5. Draw the widget (mandatory)
`read_me` module `mockup` → `show_widget` rendering the 1–3 layouts side by side (CSS vars, accent teal),
each labelled, recommended one marked. The user looks and picks → hands off to **`/starci-fe-ux-apply`**.

> No separate memory or refs folders. The knowledge IS `{design,ui,decision}/` + `cannon/` — it gets
> richer every loop, so each brainstorm starts smarter than the last.
