---
name: starci-fe-cannon-apply
description: >-
  Auto-apply the StarCi Academy FE code canon while writing NEW frontend source in
  the main web app. Use when creating or scaffolding new UI — a new component, block,
  feature, hook, SWR query/mutation, Redux slice, Zustand store, form, modal/drawer,
  page, type, or palette — or when the user says "viết code FE mới", "tạo component
  mới", "new feature", "scaffold", "build this page/component", "add a hook/slice/form",
  or "apply the patterns". Follows the shared canon at ../../cannon/CONTENT.md
  so new code is born on-pattern. NOT for auditing legacy code — use
  starci-fe-cannon-audit for that.
---

# StarCi FE — Pattern Apply (new source)

You are writing **new** StarCi Academy frontend code. Make it born on-canon — match the house patterns
exactly so it needs no later audit fix.

## Step 0 — Load the canon
ALWAYS open **`../../cannon/CONTENT.md`** first (absolute: `cannon/CONTENT.md` at repo
root). Internalize the 4-tier model (§0) and the per-slice RULEs. When unsure, find the cited EXAMPLE
file in the repo and mirror it.

## Step 1 — Classify what you're building → route to the right tier
- **Pure presentational, props-only, no data?** → `components/blocks/<category>/Name/index.tsx`.
  Props `extends WithClassNames<undefined>`; own all Tailwind; NO `useAppSelector`/`useSwr*`/`useTranslations`.
- **Owns data / routing / i18n?** → `components/features/<domain>/Name/index.tsx`, `"use client"`,
  decompose into colocated sub-components, pass plain data down to blocks.
- **A page?** → `app/[locale]/.../page.tsx`: 5–10 line mount shell, one component, JSDoc route, no logic,
  no `"use client"` unless it actually needs client APIs.
- **Data fetch?** → raw runner in `modules/api/graphql/{queries,mutations}/` + SWR wrapper in
  `hooks/swr/api/graphql/{queries,mutations}/`. Component calls ONLY the SWR hook.
- **Shared cross-route state?** → `redux/slices/<domain>.ts`. **Overlay / multi-step form / page tab?**
  → Zustand under `hooks/zustand/`. **Self-contained form?** → RHF under `hooks/rhf/`.
- **A type?** → entity in `modules/types/entities/`, enum in `enums/`, feature-local in the feature's `types/`.
- **A color map?** → `components/pallettes/<name>.ts`.

## Step 2 — Write it to spec (per-slice quick rules)
**Structure:** `@/` for cross-folder imports; kebab-case util/type files; PascalCase component folders +
`index.tsx`; add an `export *` barrel `index.ts` to every shared folder; group imports (react/next →
third-party → `@/` buckets → relative); `import type` for type-only.

**Component:** extend `WithClassNames<undefined>`; HeroUI v3 compound anatomy (`Modal.Body`, `Card.Content`,
`Drawer.*`, `Tabs.*`); overlays via a named `useXxxOverlayState()` + register in `OverlayKey`/`OVERLAY_KEYS`
+ mount in `ModalContainer`/`DrawerContainer`; wrap data regions in `<AsyncContent>`.

**Data:** query hook = `useSWR(["KEY", ...gate] ? : null, async () => {…throw on missing…})`, ends in `Swr`,
dispatches into Redux only for app-wide data; mutation hook = `useSWRMutation<Result, Error, string,
XxxRequest>("KEY", …)` with all 4 generics (`useMutate*` GraphQL / `usePost*` REST), no dispatch inside;
raw runner creates a fresh `createAuth/NoAuthApolloClient` (`cache:false`); co-locate `types/<name>.ts`; omit
the `QueryXxx` variant enum unless a real variant exists. `AsyncContent`: `isLoading = !data && !error`,
`error = !data ? error : undefined`, `onRetry: () => { void swr.mutate() }`, always pass `emptyContent`.
App-wide no-consumer queries go in `SwrSideEffects`.

**State:** typed `useAppSelector/useAppDispatch` from `@/redux`; slice template (interface `<X>Slice`,
fully-explicit `initialState`, `const <name>Slice`, granular `set<Domain><Field>` + paired `reset`, payload
interfaces at file bottom); Record + Immer for keyed real-time; Redux tabs = `enum`. Zustand: `store.ts`
(`"use client"`, extract `initialState` for `reset`) + `index.ts` + `use<Domain>Form.ts`; select per-field;
URL→Redux via `useSyncRedux*` in `UseEffects` (`useLayoutEffect` when clearing before paint).

**Forms:** RHF hook returns `{ ...form, onSubmit }`; i18n Zod schema in `useMemo([t])`; Redux defaults via
`values:`; run mutations through `useGraphQLWithToast()`/`useRestWithToast()` inside `handleSubmit`; envelope
`if(!env) throw; if(!env.success) throw(env.error ?? …)`; side-effects (revalidate/reset/onSuccess) BEFORE
`return env`; multi-step/shared → Zustand form with formik-compat shape + `useMemo` errors (no zodResolver);
`<FieldError>` inside `<TextField>`; submit button `isPending`+`isDisabled`+render-prop spinner; Modal/Drawer
shells exactly per SLICE 5.8 (`Drawer.Dialog className="p-0"`).

**Types:** `interface <X>Entity extends AbstractEntity`; `Array<T>` (never `T[]`); `enum` (never `as const`);
`Params` suffix for arg bags, no `Result` suffix; `import type` for types; multiline JSDoc on exported utils;
import from `@/modules/types` root. Do NOT add to legacy `src/types/index.ts`.

**Styling:** no tailwind config — tokens in `globals.css` (OKLCH, hue 354); static color → Tailwind utility
(`bg-accent/10 text-accent`), data-driven → `var(--token)` in `style`, prop alpha → `color-mix`; spacing
scale `0/2/3/6` (never `gap-1.5`); blocks own all `p-*`/layout/color, features stay style-free; Phosphor
icons with `aria-hidden`+`focusable="false"` and the size scale; HeroUI slot overrides only in `globals.css`.

**Routing/i18n:** routes under `[locale]/`; `useTranslations()` no namespace + dotted keys; `pathConfig()…
.build()` for URLs (pass the locale explicitly); `publicEnv()` not `process.env`; layouts needing the active
segment use `useSelectedLayoutSegment()`; new Keycloak code uses double-UUID verifier + `kc_idp_hint` +
`window.location.href`.

## Step 3 — Pre-commit checklist (run before you finish)
- [ ] No `useAppSelector`/`useSwr*`/`useTranslations` in any `blocks/**` file.
- [ ] Every props interface extends `WithClassNames<undefined>`; HeroUI compound anatomy used.
- [ ] Components call only `useXxxSwr` hooks — no Apollo/axios/`useSWR` in components.
- [ ] SWR query gated by `null` key; mutation hook has all 4 generics; correct `useMutate*`/`usePost*` prefix.
- [ ] Data regions use `<AsyncContent>` with correct `isLoading`/`error`/`onRetry`/`emptyContent`.
- [ ] Redux: typed hooks from `@/redux`; slice follows the template; granular setters + paired resets.
- [ ] Zustand: `"use client"`, 3-file module, per-field selectors, `reset` spreads `initialState`.
- [ ] Forms: `{ ...form, onSubmit }`, i18n schema in `useMemo`, toast via wrapper, side-effects before
      `return env`, `<FieldError>`, submit-button guard.
- [ ] Types: `<X>Entity extends AbstractEntity`, `Array<T>`, `enum`, `import type`, JSDoc on exported utils.
- [ ] Styling: tokens not raw colors, scale-`0/2/3/6` (no `gap-1.5`), features style-free, icons
      `aria-hidden`+`focusable="false"`.
- [ ] Routing: `useTranslations()` no namespace, `pathConfig().build()`, `publicEnv()`, thin `page.tsx`,
      barrel `index.ts` added.
- [ ] Run `tsc --noEmit` + `eslint` on touched files; fix before finishing.

Mirror the canon's cited EXAMPLE files when in doubt. If a requirement genuinely conflicts with the canon,
follow the canon and note the deviation explicitly rather than silently breaking the pattern.
