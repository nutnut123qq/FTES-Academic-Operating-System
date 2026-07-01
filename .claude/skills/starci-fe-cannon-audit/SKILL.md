---
name: starci-fe-cannon-audit
description: >-
  Audit EXISTING / LEGACY frontend source in the StarCi Academy web app against the
  StarCi FE code canon and report deviations. Use when the user says "audit", "soi
  code cũ", "review legacy FE", "check pattern compliance", "pattern audit", "find
  deviations", "is this on-canon", "rà soát code FE", or asks whether existing
  components/hooks/slices/forms/styling follow the house patterns. Reads the shared
  canon at ../../cannon/CONTENT.md and checks files slice-by-slice (structure,
  components, data fetching, state, forms, types, styling, routing), then reports
  findings ranked by severity. NOT for writing new code — use starci-fe-cannon-apply
  for that.
---

# StarCi FE — Pattern Audit (legacy / existing source)

You are auditing **existing** StarCi Academy frontend code (`C:\Repositories\starci-academy`
or `D:\Repositories\starci-academy`) against the house canon.

## Step 0 — Load the canon
ALWAYS open **`../../cannon/CONTENT.md`** first (relative to this skill file; absolute
`cannon/CONTENT.md` at repo root). It is the source of truth for every RULE, the per-rule
VIOLATION definitions, and **Appendix A — the master inconsistency ledger** (your pre-seeded hit-list
of known drifts with exact file paths). Do not rely on memory; cite the canon's rule IDs (e.g.
"SLICE 3.7 AsyncContent", "SLICE 2.1 block-purity").

## Step 1 — Scope the audit
- If the user named files/folders, audit those.
- Otherwise pick a coherent unit (one feature folder, one slice, one blocks category) — never the whole
  repo blindly. Confirm scope in one line, then proceed.
- Enumerate the target files with Glob; read them with Read. Use Grep for repo-wide pattern sweeps
  (e.g. `useState.*[Oo]pen`, `from "react-redux"`, `gap-1\.5`, `T\[\]` under `modules/types`).

## Step 2 — Check each slice
Walk the file(s) against every slice. For each, the high-signal violations to catch:

**Structure (SLICE 1)**
- Relative `../../` escaping a feature subtree (should be `@/`).
- Missing barrel `index.ts`, or barrels using named re-exports instead of `export *`.
- Logic / hooks / data fetching inside `app/**/page.tsx` (must be a 5–10 line mount shell).
- camelCase util files / typo files (`lession`, `Readed`) — flag, don't propagate.

**Components (SLICE 2)** — the highest-value slice
- **Block purity:** any `useAppSelector` / `useSwr*` / `useTranslations` inside `components/blocks/**`.
- Props interface not extending `WithClassNames<undefined>`; raw `className?: string`.
- Flat HeroUI v2 imports (`{ Card, CardContent }`) vs compound `Card.Content`.
- Overlay state via local `useState` instead of `useXxxOverlayState()`; modal mounted inline.
- Inline `if (isLoading) return <Skeleton/>` instead of `<AsyncContent>`.
- Inline color ternaries that belong in `components/pallettes/`.

**Data (SLICE 3)**
- Component importing Apollo / axios / raw `useSWR` directly (must call a `useXxxSwr` hook).
- Query hook: guard only in fetcher (not `null` key); dispatch in a UI-local hook; name not ending `Swr`.
- Mutation hook: missing the 4 `useSWRMutation` generics; dispatch inside it; REST named `useMutate*`.
- `AsyncContent` misuse: skeleton after first load, `await swr.mutate()` in retry, missing `emptyContent`.
- Singleton axios; raw Apollo client reuse; Apollo cache enabled; unused `QueryXxx` variant enum.

**State (SLICE 4)**
- `useSelector`/`useDispatch` from `react-redux` (must be `@/redux` typed hooks).
- Slice template breaks: `const slice` / `interface <X>State` / `initialState = {}` / generic
  `patch(partial)` / payload types in a separate file / dead empty slice in barrel.
- Zustand: full-store subscription, `create()` in the form hook, hardcoded `reset` values, missing
  `"use client"`, `useOverlayStore()` called directly in a component.
- URL→Redux dispatch inside a page/layout instead of a `useSyncRedux*` effect in `UseEffects`.

**Forms (SLICE 5)**
- RHF hook cherry-picking instead of `{ ...form, onSubmit }`.
- i18n Zod schema at module level (must be `useMemo`).
- `toast.*` called directly inside a GraphQL/REST mutation flow (must use `useGraphQLWithToast`).
- Side-effects after `await runGraphQL(...)` instead of before `return env`.
- zodResolver inside a Zustand form; multi-step state in `useForm` defaultValues.
- `<Typography text-danger>` error inside `<TextField>` instead of `<FieldError>`.
- Submit button without `isPending`+`isDisabled` double-submit guard or render-prop spinner.
- `Drawer.Dialog className="p-3"` clipping the divider.

**Types (SLICE 6)**
- Entity not `interface <X>Entity extends AbstractEntity`; `IFoo`/`TFoo`/bare names.
- `T[]` instead of `Array<T>` in `modules/types/**`.
- Bare `import` for a type-only symbol.
- `const X = {...} as const` instead of `enum`; duplicate enums with diverging values (`PricingPhase`).
- Exported util missing JSDoc; deep-path import instead of `@/modules/types`.

**Styling (SLICE 7)**
- Raw hex/oklch/named colors (`red-500`, `purple-500`) instead of tokens; `--difficulty-insane` ignored.
- Feature applying its own `p-*`/`gap-*`/color (blocks-own-style violation).
- `gap-1.5` off-scale; mixed spacer tiers.
- Icons missing `aria-hidden`/`focusable="false"`; `@gravity-ui/icons` usage; non-themeable inline fill.
- HeroUI slot overridden inline instead of in `globals.css`.
- A `tailwind.config.js` / `theme.extend`.

**Routing/i18n (SLICE 8)**
- `usePathname()` for active-segment in a layout (should be `useSelectedLayoutSegment()`).
- `getTranslations()` anywhere; `useTranslations("ns")` with a namespace arg.
- Manual route template strings instead of `pathConfig()…build()`; `pathConfig().locale()` no-arg.
- `process.env.X` in a component instead of `publicEnv()`.
- Mixed `useRouter` sources in one component; Keycloak Google/GitHub divergence.

## Step 3 — Report (prioritized)
Group findings by **severity**, each with `file:line`, the violated **canon rule ID**, and a one-line fix:
- **P0 — breaks the architecture contract:** block calling store/SWR/i18n; component calling Apollo/axios
  directly; overlay via `useState`; `react-redux` raw hooks; secrets/`process.env` in component.
- **P1 — pattern drift that will bite:** missing `AsyncContent`/wrong loading logic; mutation hook
  missing generics; RHF cherry-pick; i18n schema at module scope; feature owning styling; raw colors.
- **P2 — cosmetic / naming / consistency:** typos (`lession`/`Readed`), camelCase util files,
  `gap-1.5`, missing `focusable`, missing JSDoc, unnecessary `"use client"`.

Cross-reference **Appendix A** — if a finding is already a known ledger entry, say so (don't re-litigate;
just confirm it's still present). End with a short summary table (counts per severity) and the top 3
highest-leverage fixes. Do NOT auto-edit unless the user explicitly asks — this skill reports; the apply
skill changes code.
