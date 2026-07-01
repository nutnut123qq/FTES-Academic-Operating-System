# StarCi Academy — Frontend CODE-CANNON

> Authoritative, prescriptive reference for the StarCi Academy web app
> (`Next.js App Router + React 19 + HeroUI v3 + Tailwind v4 + SWR + Redux Toolkit + Zustand + RHF + Phosphor`).
> Distilled from a full scan of `src/`. Every rule below is grounded in a real in-repo file.
>
> **How to read this doc:** each pattern states the **RULE**, a concrete **EXAMPLE** (real path),
> **DO / DON'T**, and the **VIOLATION** an audit should flag. The two companion skills
> (`starci-fe-cannon-audit`, `starci-fe-cannon-apply`) reference this file and must stay in sync with it.
>
> Repo layout for skills: this canon lives at `cannon/CONTENT.md`; skills live at
> `skills/<name>/SKILL.md` and reference it as `../../cannon/CONTENT.md`.

---

## 0. The 4-tier mental model (read this first)

```
Tokens (globals.css, OKLCH, brand hue 354)
   ↓
HeroUI v3 (compound anatomy) + globals.css overrides
   ↓
blocks/    = tier-3 presentational, PROPS-ONLY (no hooks, no store, no SWR, no i18n)
   ↓
features/  = data owners + orchestrators (SWR + Redux + routing + i18n)
   ↓  (page.tsx mounts exactly one feature, no logic)
app/[locale]/.../page.tsx
```

**Golden law:** data/logic flows DOWN from `features/` into `blocks/` as plain props.
A block never reaches up (no `useAppSelector`, no `useSwr*`, no `useTranslations`). Features
never own pixel styling (`p-*`, color classes) — blocks do.

---

## SLICE 1 — Project & File Structure

### 1.1 Single path alias `@/*`
**RULE:** Exactly one alias `@/* → ./src/*` (`tsconfig.json`). No sub-aliases.
Use `@/` for every cross-folder import; use `./` / `../` only within the same feature tree.
- **DO:** `import { useAppSelector } from "@/redux"`
- **DON'T:** `import x from "../../redux"` to cross a top-level `src/` folder.
- **VIOLATION:** relative `../../` that escapes the current feature subtree.

### 1.2 Eleven stable top-level folders
`app/` (router shells only), `components/`, `hooks/`, `modules/` (headless infra), `redux/`,
`resources/` (static config: `assets/ constants/ env/ path/`), `types/` (cross-cutting FE types),
`utils/` (pure fns), `config/`, `data/` (rare static fixtures), `i18n/` + `messages/`.
- **VIOLATION:** business logic / data fetching inside `app/`; entity types outside `modules/types/`.

### 1.3 File naming (split convention — memorize the matrix)
| Thing | Convention | Example |
|---|---|---|
| Component folder | PascalCase folder + `index.tsx` | `LessonReader/index.tsx` |
| Util / type file inside a feature | kebab-case **preferred** | `grade-credit-label.ts`, `content-tabs.ts` |
| GraphQL runner | `query-*.ts` / `mutation-*.ts` (kebab) | `mutation-ask-content-ai.ts` |
| Redux slice | kebab-case | `redux/slices/content.ts` |
| SWR hook file | `useQueryXxxSwr.ts` / `useMutateXxxSwr.ts` / `usePostXxxSwr.ts` (PascalCase verb prefix) | `useQueryChallengeSwr.ts` |
| Zustand files | `store.ts`, `hooks.ts`, `use<Domain>Form.ts` | `overlay/store.ts` |
| Route segment | kebab-case | `personal-project/`, `mind-map/` |
- **VIOLATION (audit-flag):** camelCase util files inside features (`moduleExpansion.ts`, `pastel.ts`) — known legacy drift; new files MUST be kebab-case. Typo files like `redux/slices/lession-video.ts` and `useMutateMarkContentAsReadedSwr` (should be `lesson` / `Read`) — flag, do not propagate.

### 1.4 Barrel `index.ts` everywhere, `export *` only
**RULE:** Every shared-concern folder has an `index.ts` re-exporting via `export * from "./X"`.
No named re-exports, no side-effect code in barrels. Deep nesting re-exports all the way up
(`modules/api/graphql/mutations/* → mutations/index.ts → graphql/index.ts → api/index.ts`).
- **DON'T:** `export { Foo } from "./Foo"`.
- **VIOLATION:** missing barrel in a shared folder; a barrel using named re-exports; importing a feature internal by deep path instead of from its `index.tsx`.

### 1.5 Import grouping order (observed convention)
Separate `import {} from` block per module, grouped: (1) react/next/next-intl, (2) third-party
(`swr`, `@apollo/client`, `@heroui/react`), (3) `@/` buckets roughly `@/redux → @/modules/types →
@/modules/api → @/hooks → @/components/* → @/resources`, (4) relative `./`. Pure type imports use
`import type {}`.
- **VIOLATION:** type-only import without `import type`; mixing `../` and `@/` for the same cross-folder reach.

### 1.6 Page files are thin mount shells
**RULE:** `page.tsx` declares a local `Page`, mounts exactly one `components/` component, `export default Page`. 5–10 lines, no hooks/SWR/logic. A JSDoc names the route.
- **EXAMPLE:** `src/app/[locale]/.../contents/[contentId]/page.tsx` → `const Page = () => <LessonReader />`
- **VIOLATION:** any hook / SWR / data-fetch / non-trivial JSX in `page.tsx`. Exception: server-component pages with `generateMetadata` + `cache()` (`profile/[username]/page.tsx`, `contents/[contentId]/page.tsx`) — these legitimately omit `"use client"`. Pages that only render a client component should NOT carry `"use client"` (current widespread drift — flag for new pages).

### 1.7 Feature internal layout
```
FeatureName/
  index.tsx            ← public root (the only cross-boundary export)
  map.ts | map.tsx     ← lookup/icon dictionaries (optional)
  types/index.ts + *.ts
  constants/index.ts + *.ts
  hooks/useXxx.ts      ← (add an index.ts barrel for NEW features)
  enums/ utils/
  SubComponent/index.tsx
```
- **DON'T:** import a feature's internals across feature boundaries — go through its `index.tsx`.

### 1.8 Three type locations
`modules/types/entities/` (DB-mirror entities), `modules/types/enums/`, `modules/types/base/`
(`WithClassNames`), `src/types/index.ts` (cross-cutting FE types — also holds **legacy** static
types, do NOT add to it), feature-local `types/` (presentational, not shared).

---

## SLICE 2 — Component Architecture

### 2.1 Block = tier-3, props-only
**RULE:** A `blocks/` component receives all content + callbacks via props, owns its full Tailwind
styling, and calls NO `useAppSelector` / `useSwr*` / `useTranslations`. Only `cn` and pure render logic.
- **EXAMPLE:** `src/components/blocks/layout/PageHeader/index.tsx`
- **DO:** `export const MyBlock = ({ data, onPress, className }: MyBlockProps) => …`
- **VIOLATION:** any data/store/i18n hook in a block. **Known breaches to flag:** `CourseCard` calls `useLocale/useTranslations/useRouter` (deliberate but off-canon); `SubPageHeader` & `ProgrammingLanguageTabs` (in `reuseable/`) call `useTranslations`; `SectionCard` / `PressableCard` are pure blocks misfiled in `reuseable/` (should live in `blocks/cards/`).

### 2.2 Feature = data owner + orchestrator
**RULE:** Feature root files are `"use client"`, own SWR + Redux selectors + routing + i18n, and
decompose into colocated sub-components by passing computed data down.
- **EXAMPLE:** `src/components/features/learn/LessonReader/index.tsx`.

### 2.3 Prop typing extends `WithClassNames<undefined>`
**RULE:** Every public component interface `extends WithClassNames<undefined>`
(from `@/modules/types/base/class-name`), giving `className?: string`. Use a shaped generic
(`WithClassNames<{ slot?: string }>`) only for genuine multi-slot components (e.g. `AIProcessingText`).
- **DON'T:** add a raw `className?: string` directly (duplicates the contract).
- **VIOLATION:** props interface not extending `WithClassNames`.

### 2.4 HeroUI v3 compound anatomy
**RULE:** Use dot-notation parts: `Modal.Backdrop/Container/Dialog/Header/Body`, `Drawer.*`,
`Tabs.List/Tab`, `Card.Content`, `Accordion.Item`.
- **VIOLATION:** flat v2-style named imports `{ Card, CardContent }` / `{ ModalHeader }`. Known drift in `PaymentModal`, `LessonReader` — new code uses `Card.Content`.

### 2.5 Overlay state via `useXxxOverlayState()`, mounted in singleton containers
**RULE:** Every modal/drawer reads its own open state via a named `useXxxOverlayState()` hook
(backed by the single `useOverlayStore`). All modals listed in `modals/ModalContainer.tsx`, all
drawers in `drawers/DrawerContainer.tsx`, both mounted once in the root layout. Never prop-drill
`isOpen`/`onClose`; never `useState` for an overlay.
- **VIOLATION:** local `useState` modal open state; modal mounted inline at usage site.

### 2.6 `AsyncContent` for every data-backed region
See SLICE 3.7. Inlined `if (isLoading) return <Skeleton/>` in a feature is a **VIOLATION**.

### 2.7 Palettes = enum→class maps, no JSX
**RULE:** `components/pallettes/*.ts` map an enum to class strings; no components, no hooks.
- **EXAMPLE:** `src/components/pallettes/difficulty.ts`.
- **VIOLATION:** inline ternary color logic in a feature render that belongs in a palette.

### 2.8 Wrapper-block pattern
A feature sub-component may wrap a block by transforming feature data into the block's data
contract, then delegating all styling to the block (e.g. `LessonReader/ContentTabBar` builds a
`TabsCardGroup` and renders `<TabsCard>`). The wrapper may use hooks; the block stays pure.

### 2.9 Known duplications to flag
`blocks/async/EmptyContent` vs `blocks/feedback/EmptyState` (overlapping APIs — consolidation
candidate); `features/navbar/Navbar` vs `layouts/shell/Navbar` (near-identical copies).

---

## SLICE 3 — Data Fetching

### 3.1 Strict 3-tier layering
```
modules/api/graphql/{queries,mutations}/query-*.ts | mutation-*.ts   ← raw Apollo
modules/api/rest/<area>/*.ts                                         ← raw axios
hooks/swr/api/graphql/{queries,mutations}/useXxxSwr.ts              ← SWR wrappers
hooks/swr/api/rest/mutations/usePostXxxSwr.ts                        ← SWR REST wrappers
```
**Components call ONLY SWR hooks** — never Apollo / axios directly.
- **VIOLATION:** `useSWR`/Apollo/`axios` imported in a component or feature.

### 3.2 Query hook = `useQueryXxxSwr`
**RULE:** A `useSWR` wrapper returning the raw handle. Key = `["SCREAMING_SNAKE_KEY", ...gating state]`.
Gate by setting the key to `null` until prerequisites met (`authenticated && id ? [...] : null`);
the fetcher repeats the guard with a `throw` for type-safety. Hooks serving **app-wide shared**
data `dispatch()` into Redux inside the fetcher; **UI-local** hooks do not dispatch.
- **EXAMPLE:** `src/hooks/swr/api/graphql/queries/useQueryCourseSwr.ts`.
- **VIOLATION:** guard only in fetcher (not in key); dispatching inside a UI-local query hook; query hook not ending in `Swr`.

### 3.3 Mutation hook = `useMutateXxxSwr` / `usePostXxxSwr`
**RULE:** `useSWRMutation<Result, Error, string, XxxRequest>` with a SCREAMING_SNAKE key.
`Result = Awaited<ReturnType<typeof mutateXxx>>`. GraphQL → `useMutate*`; REST → `usePost*`.
Always supply all 4 generics. No Redux dispatch inside mutation hooks — side-effects belong to the
caller / form action.
- **EXAMPLE:** `src/hooks/swr/api/graphql/mutations/useMutateToggleFavoriteSwr.ts`.
- **VIOLATION:** missing generics; dispatch inside a mutation hook; REST mutation named `useMutate*`.

### 3.4 Raw API layer
**RULE:** Each `query-*.ts` / `mutation-*.ts` exports one async `queryXxx` / `mutateXxx` that creates
a **fresh** Apollo client per call (`createAuthApolloClient` / `createNoAuthApolloClient`, `cache: false`)
and `.query()`/`.mutate()`s. Co-locate `types/<name>.ts` with `QueryXxxResponse` + `XxxRequest`.
SWR is the cache layer, not Apollo's InMemoryCache.
- **`createNoAuthApolloClient`** is for auth-flow ops only (`signInInit/Verify`, `signUpInit/Verify`).
- **VIOLATION:** reusing a shared Apollo client; enabling Apollo cache; defining a `QueryXxx`/`MutationXxx` variant enum + `queryMap` when only `Query1` exists (omit the unused enum for new ops). Return-shape divergence: most mutations return full `FetchResult`; `mutateAskContentAi`/`mutateToggleFavorite` pre-unwrap — flag, prefer returning full `FetchResult`.

### 3.5 GraphQL custom headers
Pass `GraphQLHeadersKey` values via the `headers` param (`X-Course-Id` to scope enrollment auth,
`X-Locale` for locale-targeted ES indexes).

### 3.6 Global side-effect queries → `SwrSideEffects`
**RULE:** Queries that must run app-wide purely for their Redux side-effect (no direct component
consumer) are mounted once in `src/hooks/swr/SwrSideEffects.tsx` (renders `null`). Queries with a
direct consumer run inside that component instead. This replaces the old mega-context pattern.
- **VIOLATION:** a no-consumer global query mounted ad-hoc in a feature.

### 3.7 `AsyncContent` block contract
**RULE:** Every SWR-backed region renders `<AsyncContent isLoading skeleton isEmpty? emptyContent?
error? errorContent?>`. Priority `error → isLoading → isEmpty → children`. Conventions:
- `isLoading = !swr.data && !swr.error` (first-load skeleton only).
- `error = !swr.data ? swr.error : undefined` (prefer stale data over error once loaded).
- `onRetry: () => { void swr.mutate() }` (use `void`, not `await`).
- Always pass `emptyContent` or return `null` for empty.
- **EXAMPLE:** `src/components/blocks/async/AsyncContent/index.tsx` + `features/learn/CourseContents/index.tsx`.
- **VIOLATION:** skeleton shown after first load; inline loading/empty/error branches; `await swr.mutate()` in retry.

### 3.8 Infinite scroll & typeahead factories
`useSWRInfinite` hooks return `null` from `getKey` to stop (offset short page / `nextCursor === null`);
page limits are exported consts (`FOLLOW_LIST_PAGE_LIMIT`). All `*Suggestions` hooks delegate to
`useEntitySuggestionsSwr(fetchFn, query, opts)` (owns locale key + `keepPreviousData` + `enabled`).

### 3.9 SWR config deviations
Override defaults only with intent: `keepPreviousData:false` to avoid bleeding prior lesson body
(`useQueryContentSwr`, `useQueryChallengesSwr`); `keepPreviousData:true` for paginated/typeahead;
`refreshInterval` only for genuine polling (notifications bell 60s, admin health, CV processing).
Global defaults (`SwrProvider`): fresh `Map()` cache, `revalidateOnFocus:false`,
`revalidateOnReconnect:false`, `dedupingInterval:60_000`, `keepPreviousData:false`.

### 3.10 REST layer
Each REST fn does `axios.create(...)` per call and returns `response.data` directly; always wrap in a
`usePostXxxSwr`. **VIOLATION:** singleton axios; component calling a raw REST fn.

---

## SLICE 4 — Client State (Redux / Zustand / RHF)

### 4.0 Decision tree
| Condition | Choice |
|---|---|
| Survives route navigation / driven by URL param / WS real-time / auth session | **Redux** |
| Modal/drawer open + optional payload | **Zustand `overlay` store** |
| Multi-step form surviving unmount, or shared across two subtrees | **Zustand form store** |
| Page-scoped tab needed by siblings | **Zustand tab store** |
| Self-contained single-step form | **RHF** (`src/hooks/rhf/`) |

### 4.1 Redux slice anatomy (strict template)
**RULE:** One kebab file per domain in `redux/slices/`, barreled through `slices/index.ts → redux/index.ts`.
Each slice: (1) type imports, (2) `export interface <Name>Slice`, (3) `const initialState: <Name>Slice`
(every field explicit, `undefined`/`[]` — never omitted), (4) `export const <name>Slice = createSlice(...)`,
(5) export `<name>Reducer` + named actions. Payload interfaces declared at the bottom of the same file.
- **EXAMPLE:** `src/redux/slices/content.ts`, `socketio.ts`.
- **VIOLATION:** `const slice` instead of `const <name>Slice` (drift: `milestone.ts`); `interface <Name>State` instead of `<Name>Slice` (drift: `milestone.ts`); `initialState = {}` omitting fields (drift: `system.ts`); payload types in a separate file; dead empty slice files registered in the barrel (drift: `cv-presigned-url.ts`).

### 4.2 Typed hooks only
**RULE:** Always `useAppSelector` / `useAppDispatch` from `@/redux`. Never `useSelector`/`useDispatch`
from `react-redux`.
- **VIOLATION:** importing raw react-redux hooks.

### 4.3 Granular setters + paired resets
**RULE:** One `set<Domain><Field>` per settable field (compound setters allowed, e.g. `setCourse`).
Anything representing a clearable "session" gets a companion `reset<Domain>(Field)` so the call site
never needs to know the initial value. No generic `patch(partial)` action.
- **VIOLATION:** `updateX(partial: Partial<...>)`; `setX(initialValue)` from a call site.

### 4.4 Active-entity pattern
**RULE:** Redux holds `id`/`displayId`; a `useQueryXxxSwr` watches `state.<domain>.id` and fetches;
the entity lands back via the fetcher's dispatch. Single source of truth — don't also pass the id as a
hook prop.

### 4.5 URL → Redux sync hooks in `UseEffects`
**RULE:** Each URL-driven segment gets `useSyncRedux<Domain>Id.ts` in `hooks/effects/`, all mounted
once in `UseEffects` (renders `<></>`) at app root. Use `useLayoutEffect` + `prevRef` when stale data
must be cleared before paint (e.g. `useSyncReduxContentId`); `useEffect` otherwise.
- **VIOLATION:** dispatching on route change inside a page/layout instead of an effect hook.

### 4.6 Enums for Redux tabs/flow state
**RULE:** Tab/multi-step state in Redux = PascalCase `enum` with camelCase values
(`enum ContentTab { … = "…" }`), defined in the slice file.
- **VIOLATION:** string-union literals for Redux tab state. (Note: page-scoped **Zustand** tab stores use string unions by convention — that's allowed; the enum rule is Redux-only.)

### 4.7 Record reducers for keyed real-time data
**RULE:** Socket.IO data keyed by runtime id is `Record<string, V>`, written in-place with Immer
(`state.map[key] = value`), never array + `findIndex`. `serializableCheck: false` is set globally to
allow `ReactNode` payloads.

### 4.8 Zustand: 3-file module, `"use client"`, selector-per-field
**RULE:** Each Zustand module = `store.ts` (the `create()`, `"use client"` first line) + `index.ts`
(barrel) + optional `use<Domain>Form.ts`/`hooks.ts`. Never `create()` inside the form hook file.
Consumers select each field individually (`useStore(s => s.email)`) — never destructure the whole store.
Extract `const initialState` above `create()` and reuse it in `reset: () => set({ ...initialState })`.
- **VIOLATION:** full-store subscription `const s = useStore()`; inline `create()` in the form hook; hardcoded values inside `reset`; missing `"use client"`.

### 4.9 Overlay store
**RULE:** One `useOverlayStore` with `openMap: Record<OverlayKey, boolean>`. Every overlay = an entry
in the `OverlayKey` union + `OVERLAY_KEYS` array + one named `useXxxOverlayState()` accessor delegating
to `useOverlayHandle(key)`. Payload-carrying overlays override `open(payload)` to stash context in the
store then `openOverlay(key)`; the modal reads `context` separately.
- **EXAMPLE:** `src/hooks/zustand/overlay/hooks.ts` (`usePaymentOverlayState`).
- **VIOLATION:** calling `useOverlayStore()` directly in a component; payload via prop-drilling/Redux.

### 4.10 Providers are thin infra
**RULE:** `components/providers/` holds only `HeroUIProvider`, `NextThemesProvider`, `SwrProvider`
— no app logic. `ReduxProvider` lives at `src/redux/ReduxProvider.tsx` (co-located with the store),
exported from `@/redux`.
- **VIOLATION:** data fetching / auth / dispatch inside a provider.

---

## SLICE 5 — Forms & Feedback

### 5.1 RHF hook = spread-and-augment
**RULE:** Form hook calls `useForm<T>()`, builds `onSubmit = form.handleSubmit(async (v) => …)`, and
returns `{ ...form, onSubmit, ...extras }`. Consumers spread the full RHF API.
- **EXAMPLE:** `src/hooks/rhf/usePinExternalProjectForm.ts`.
- **VIOLATION:** cherry-picking `{ control, formState, onSubmit }`.

### 5.2 Schema placement
**RULE:** Zod schema using i18n messages → inside `useMemo(() => z.object({…}), [t])`. Static schema
(no i18n) → module-level `export const xyzSchema`.
- **VIOLATION:** i18n schema declared at module level (captures wrong locale).

### 5.3 Redux-seeded defaults use `values:`
**RULE:** When defaults come from Redux/async, pass `values:` (not `defaultValues:` + `reset()` effect)
to `useForm` so RHF re-seeds on selector change.

### 5.4 Mutations run through toast wrappers
**RULE:** GraphQL mutations run inside `runGraphQL(...)` from `useGraphQLWithToast()`; REST inside
`runRest(...)` from `useRestWithToast()`; both nested in `handleSubmit`. Nest a `runRest` inside the
outer `runGraphQL` for multi-step transactions (only the outer wrapper owns the success toast). The
wrapper returns a boolean — `if (!ok) return` to abort a flow.
- **VIOLATION:** calling `toast.success/danger` directly inside a mutation flow; importing
  `runGraphQLWithToast` from `@/modules/toast/api` in a React component (use the hook from `@/modules/toast`).

### 5.5 Envelope unwrap + throw
**RULE:** `const env = result?.data?.mutationName; if (!env) throw …; if (!env.success) throw new
Error(env.error ?? env.message ?? "fallback"); return env`. The wrapper catches the throw → toast.danger.
- **VIOLATION:** checking `env.success` outside `runGraphQL` and calling toast manually.

### 5.6 Side-effects before `return env`
**RULE:** Inside the `runGraphQL` action, run revalidation (`swr.mutate()` / `mutate([KEY,…])`),
`form.reset()`, and `onSuccess?.()` BEFORE returning `env` — not after `await runGraphQL(...)` resolves.

### 5.7 Zustand-state forms (multi-step / shared)
**RULE:** Forms surviving a step transition or shared across subtrees live in a Zustand store and
return a **formik-compatible shape** (`{ values, errors, touched, setFieldValue, setFieldTouched,
submitForm, isSubmitting }`). Errors are computed live via `useMemo` (plain JS + i18n) — **no
zodResolver** in a Zustand form. zodResolver is RHF-only.
- **EXAMPLE:** `src/hooks/zustand/signIn/useSignInForm.ts`, `cvApply/useCvApplyForm.ts`.
- **VIOLATION:** zodResolver inside a Zustand-backed hook; multi-step state in `useForm` defaultValues.

### 5.8 Modal / Drawer shells
**Modal:** `Modal > Modal.Backdrop > Modal.Container size=… > Modal.Dialog > Modal.CloseTrigger +
Modal.Header + Modal.Body`. Mounted in `ModalContainer.tsx`, never inline.
**Drawer:** `Drawer > Drawer.Backdrop isOpen onOpenChange > Drawer.Content placement={isMobile ?
"bottom" : "right"} > Drawer.Dialog className="p-0" > (p-3 wrapper with CloseTrigger + Header) >
Drawer.Body`. Placement always responsive via `useSmViewpoint()`. Mounted in `DrawerContainer.tsx`.
- **NO header divider — UNIFIED Modal + Drawer (2026-06-21):** the header ↔ body are separated by
  whitespace (header-wrapper padding + body padding), **never a `border-b` line**. Both overlays follow this.
  See `decision/overlay.md`.
- **VIOLATION:** a `border-b` divider between an overlay header and body (removed from all 6 drawers); modal mounted in a page.

### 5.9 Field error display
**RULE (canonical):** inside `<TextField isInvalid={…}>`, use HeroUI `<FieldError>`.
- **VIOLATION:** `<Typography type="body-xs" className="text-danger">` inside a `<TextField>` (drift: `ExternalProjectForm`). Auth fields (`EmailField`, `PasswordField`, `OtpState`) are canonical.

### 5.10 Submit button
**RULE:** `<Button type="submit" variant="primary" fullWidth isPending={isSubmitting}
isDisabled={isSubmitting} onPress={onSubmit}>{({ isPending }) => (<>{isPending ? <Spinner .../> :
null}{t("…submit")}</>)}</Button>`. Extra gating computed separately (`!isValid || (captcha.enabled
&& !token)`). `isPending` and `isDisabled` are both passed; spinner via render-prop.
- **VIOLATION:** two JSX branches on `isSubmitting`; missing `isDisabled` double-submit guard.

### 5.11 Direct `toast.*` only for non-API feedback
**RULE:** `toast.success/danger` direct calls are allowed ONLY for non-mutation UI feedback (clipboard
copy, share, WS status). Anything with a GraphQL/REST envelope goes through the wrapper.
- **VIOLATION:** mixing direct `toast.*` with `useGraphQLWithToast()` for the same mutation (drift: `EvalChallengePanel`).

---

## SLICE 6 — Types & Utils

### 6.1 Entity naming
**RULE:** DB-mirror types are `interface <Domain>Entity extends AbstractEntity`, one per kebab file in
`modules/types/entities/`. Never `type`, never `IFoo`/`TFoo`, never bare `Course`.
- **VIOLATION:** `Course`/`ICourse`/`type CourseEntity = {…}`; entity not extending `AbstractEntity`.

### 6.2 Non-entity structured types
Plain descriptive `interface` (no `Entity` suffix). `Params` suffix for function-arg bags
(`ListChallengeProgrammingLangsParams`). No `Result` suffix — return types are inferred/inline.

### 6.3 Enums
**RULE:** PascalCase `enum`, string values matching backend (camelCase or snake_case), one kebab file
in `modules/types/enums/`, JSDoc line per member.
- **VIOLATION:** `const X = {…} as const` instead of `enum`. **Critical drift:** `PricingPhase` defined twice with diverging `EarlyBird` (`"early_bird"` in legacy `src/types/index.ts` vs `"earlyBird"` in `modules/types/enums/pricing-phase.ts`) — canonical = the enums file.

### 6.4 Discriminated unions
`type Foo = A | B | C`, each variant a standalone `interface` with a discriminator field typed as an
enum (`flow: PaymentFlow.CourseEnroll`). Co-locate the driving enum with the union (`payment.ts`).

### 6.5 `Array<T>` everywhere in `modules/types/**`
**RULE:** Use `Array<T>`, never `T[]`, in `modules/types/**` declarations and signatures.
- **VIOLATION:** `Foo[]` (drift: `src/utils/extract-sandpack-files.ts` uses `CodeExplainingEntity[]`).

### 6.6 `import type` for type-only symbols
**RULE:** All type-only cross-file imports use `import type`. Bare `import` only for runtime values
(functions, enums used as values, e.g. `DEFAULT_PROGRAMMING_LANGUAGES`).
- **VIOLATION:** bare `import { SomeType }` used only as a type.

### 6.7 JSDoc on exported util fns
**RULE:** Exported fns in `modules/types/utils/**` and `src/utils/**` get a multiline JSDoc:
summary, `@param name - desc` (dash form, no `{type}`), `@returns`. Private helpers may omit.
- **VIOLATION:** exported util with no JSDoc (drift: `src/utils/filename.ts`).

### 6.8 Import from package roots
Feature/component code imports from `@/modules/types`, `@/resources`, `@/hooks`, `@/redux` — never
deep paths. `superjson` is a single configured singleton (`src/modules/superjson/index.ts`).
**Legacy warning:** `src/types/index.ts` holds pre-GraphQL static types (`Course`, `Module`, duplicate
`PricingPhase`) — do not extend it; new types go to `modules/types/`.

---

## SLICE 7 — Styling & Design Tokens

### 7.1 Tailwind v4, no config file
**RULE:** Tailwind v4 via `@tailwindcss/postcss`; NO `tailwind.config.js`, NO `theme.extend`. All
theming in `globals.css`. Import order: `@import "tailwindcss"; @import "@xyflow/react/dist/style.css";
@import "@heroui/styles";`.
- **VIOLATION:** creating a tailwind config; `theme.extend`.

### 7.2 Tokens: OKLCH, brand hue 354, in `:root`/`.dark`
**RULE:** Every semantic color is a CSS var `oklch(L% C H)` in `globals.css` (brand hue **354**). No
hex/rgb in token definitions. Categories: semantic (`--accent --foreground --muted --background
--border --surface* --separator --overlay --field-*`), status (`--danger --success --warning
--difficulty-insane`), heatmap ramp `--heat-0..--heat-4`, structural (`--radius .5rem`,
`--field-radius .75rem`, `--font-sans`).
- **VIOLATION:** raw oklch/hex literal inline in a component.

### 7.3 Token application — pick the right channel
- **Static styling →** Tailwind semantic utilities (`bg-accent/10 text-accent`, `bg-success/10`,
  `hover:bg-surface-secondary`). **(default, dominant)**
- **Programmatic/data-driven color →** `var(--token)` inside `style={{}}` (palettes, gradients).
- **Custom token with no Tailwind utility →** `bg-[var(--heat-N)]`.
- **Dynamic alpha from a prop color →** `color-mix(in srgb, ${color} N%, transparent)`.
- **VIOLATION:** mixing patterns for the same purpose on one component; raw named colors
  (`cyan-500`, `red-500`, `purple-500`) instead of tokens — known drift in `pallettes/difficulty.ts`
  & `advanced.ts` (note `--difficulty-insane` token exists but `Insane` uses `bg-purple-500`); admin/legacy files.

### 7.4 Spacing rhythm
`gap-0` = tight title+description pair; `gap-2` = icon+label / list items; `gap-3` = same-context
content groups & card internals; `gap-6` = cross-section separators. `PageContainer` gutter
`px-4 py-16 sm:px-6 lg:px-8 max-w-6xl mx-auto`; reading column `max-w-3xl … mx-auto`; rail/content `p-6`.
- **VIOLATION:** `gap-1.5` (off-scale, draft-rule banned — 102-file drift); spacer sizes mixed within one tier.

### 7.5 Blocks own style; features stay style-free
**RULE:** Block components carry all Tailwind (`p-*`, layout, color). Features pass data + callbacks
only — no `p-*`/layout/color classes.
- **VIOLATION:** feature applying its own `p-3`/`p-6`/`gap-*`/color (drift: `ContentHeader`, `Sessions`,
  `Security`, `AiUsage`).

### 7.6 SVG / icons
**RULE:** Brand SVGs in `components/svg/`, accept `className` via `WithClassNames<undefined>`, use
`cn(className)` on `<svg>`, `fill="currentColor"` to inherit theme (exceptions: `LogoMark`, `GoogleIcon`
intentional brand hex). Phosphor (`@phosphor-icons/react`) for inline icons: sizes `size-4` (badge) /
`size-5` (nav/chip/row) / `size-6` (header) / `size-8` (empty state) / `size-10` (cover). Every icon
`aria-hidden` + `focusable="false"`; `weight="fill"`/`"bold"` only for emphasis.
- **VIOLATION:** missing `aria-hidden`/`focusable="false"` (feature drift: `ContentHeader`, `UserStreak`,
  `Security`); using `@gravity-ui/icons` (incomplete migration — only `AIProcessingText`); inline color
  fill on a should-be-themeable SVG.

### 7.7 `SectionCard` canonical card
Bordered card, internal `flex flex-col gap-3`, no shadow (HeroUI strips it globally); `accent` variant
adds `border-accent/40 bg-accent/5`; header separator `border-b border-separator pb-3`.

### 7.8 HeroUI overrides live in `globals.css`
**RULE:** Override HeroUI slots by their BEM slot class in `globals.css` (`.switch__control`,
`.checkbox__control`, `.extended-tabs .tabs__list`), not via inline `className`/`!important` on
instances. Keyframes (`emberRise`) also in `globals.css`, respecting `prefers-reduced-motion`.
- **VIOLATION:** overriding a HeroUI slot via per-instance inline className.

---

## SLICE 8 — Routing, i18n & Resources

### 8.1 Route structure
**RULE:** All user routes under `src/app/[locale]/`. File tree mirrors the URL; dynamic segments are
the URL noun (`[courseId]`, `[contentId]`, `[username]`). Route groups (`(settings)`) only to share a
layout shell without changing the URL.

### 8.2 Layouts
Three tiers: pass-through stub (`return children`); shell import (`<SettingsLayout>`); logic-bearing
`"use client"` layout using `useSelectedLayoutSegment()` (NOT `usePathname()`) + SWR/Redux for rails
& breadcrumbs. **VIOLATION:** `usePathname()` for active-segment detection in a layout.

### 8.3 Root locale layout
Async server component: `await params` (Next 15), `getMessages()` (the ONLY server-side i18n call),
wrap in `NextIntlClientProvider` + `InnerLayout`. **VIOLATION:** `getTranslations()` anywhere (unused
in this codebase by design).

### 8.4 i18n config
`i18n/routing.ts` (`locales ["en","vi"]`, default `"vi"`, cookie `LOCALE` scoped `.academy.starci.org`)
→ `request.ts` → `navigation.ts`. **Middleware file is `src/proxy.ts`** (`export default function
proxy` + `config.matcher`) — non-standard name, keep it.

### 8.5 Client i18n usage
**RULE:** `useTranslations()` with **no namespace**; reference full dotted keys (`t("nav.home")`).
`useLocale()` (from `next-intl`) alongside it when building locale-prefixed URLs. `vi.json` is canonical;
`vi.json`/`en.json` keep identical top-level keys.
- **VIOLATION:** `useTranslations("nav")` with a namespace arg.

### 8.6 Navigation import source
`@/i18n/navigation` `Link` for anchor rendering (Navbar/blog, locale-aware). `next/navigation`
`useRouter` in hooks that build the path manually via `pathConfig().locale(locale)`.
- **VIOLATION:** mixing both `useRouter` sources in the same component.

### 8.7 URL construction via `pathConfig()`
**RULE:** All route URLs built through the fluent `pathConfig().locale(locale).course(id).learn()…
.build()`; always terminate with `.build()`. Never template-string a route in component code.
- **VIOLATION:** manual `` `/${locale}/courses/...` `` literals; `pathConfig().locale()` no-arg (returns
  `""`, silent no-op for "go home") — pass the locale explicitly.

### 8.8 Env & assets accessors
**RULE:** `publicEnv()` / `internalEnv()` are factory functions — never raw `process.env` in component
code. `assetConfig()` for static asset paths. Import from the `@/resources` barrel.
- **VIOLATION:** `process.env.X` in a component; importing `@/resources/env` / `@/resources/path`
  directly (reserve only for circular-dep cases).

### 8.9 Keycloak PKCE — canonicalize the divergence
PKCE OAuth via `modules/keycloak/`: generate `state` + `codeVerifier` + SHA-256 `codeChallenge`, stash
in `sessionStorage`, redirect to Keycloak, then `useExchangeCodeForToken` (global effect in
`InnerLayout`) exchanges `?code=` and strips params.
- **VIOLATIONS to flag (Google vs GitHub inconsistency):** verifier entropy (double-UUID vs single-UUID
  → use double-UUID), IdP hint param (`kc_idp_hint` vs `idp_hint` → use `kc_idp_hint`), redirect_uri
  (`window.location.href` vs `.origin`). Also the parallel legacy BE-redirect entry point
  (`modules/api/redirect/keycloak.ts`) coexisting with the PKCE flow.

---

## Appendix A — Master inconsistency ledger (audit hit-list)
| # | Slice | Where | Issue |
|---|---|---|---|
| 1 | 1 | `redux/slices/lession-video.ts` | typo `lession` (should `lesson`), live in barrel |
| 2 | 1 | feature util files | camelCase (`moduleExpansion.ts`) vs kebab — new files kebab |
| 3 | 1 | many `page.tsx` | unnecessary `"use client"` on pure mount shells |
| 4 | 2 | `CourseCard` (block) | calls `useLocale/useTranslations/useRouter` |
| 5 | 2 | `reuseable/SubPageHeader`, `ProgrammingLanguageTabs` | call `useTranslations` |
| 6 | 2 | `reuseable/SectionCard`,`PressableCard` | pure blocks misfiled in `reuseable/` |
| 7 | 2 | `EmptyContent` vs `EmptyState` | duplicate empty-state blocks |
| 8 | 2/5 | `PaymentModal`,`LessonReader` | flat `{ Card, CardContent }` vs `Card.Content` |
| 9 | 3 | `mutateAskContentAi`,`mutateToggleFavorite` | pre-unwrapped return vs full `FetchResult` |
| 10 | 3 | `useMutateMarkContentAsReadedSwr` | typo `Readed` → `Read` |
| 11 | 3 | `useQueryFoundationsSwr` | dual dispatch (fetcher + useEffect) |
| 12 | 4 | `redux/slices/milestone.ts` | `const slice` + `MilestoneState` naming drift |
| 13 | 4 | `redux/slices/system.ts` | `initialState = {}` omits fields |
| 14 | 4 | `cv-presigned-url.ts` | empty dead slice file in barrel |
| 15 | 5 | `ExternalProjectForm` | `<Typography>` error vs `<FieldError>` |
| 16 | 5 | `EvalChallengePanel` | direct `toast.*` mixed with wrapper |
| 17 | 6 | `extract-sandpack-files.ts` | `T[]` instead of `Array<T>` |
| 18 | 6 | `src/types/index.ts` vs `enums/pricing-phase.ts` | duplicate `PricingPhase`, diverging `EarlyBird` |
| 19 | 6 | `src/utils/filename.ts` | missing JSDoc |
| 20 | 7 | `pallettes/difficulty.ts`,`advanced.ts` | raw named colors instead of tokens |
| 21 | 7 | `ContentHeader`,`Sessions`,`Security`,`AiUsage` | features applying own `p-*`/`gap-*` |
| 22 | 7 | `AIProcessingText` | `@gravity-ui/icons` (incomplete migration) |
| 23 | 7 | 102 files | `gap-1.5` off-scale |
| 24 | 8 | `useSyncReduxCourseId` | `useEffect` vs `useLayoutEffect`; missing dep |
| 25 | 8 | Keycloak Google vs GitHub | verifier/IdP-hint/redirect_uri divergence |
| 26 | 8 | `navbar/Navbar` vs `shell/Navbar` | near-identical duplicate |

## Appendix B — Glossary
- **Block** — tier-3 props-only presentational component in `components/blocks/`.
- **Feature** — data/logic owner in `components/features/`.
- **Active-entity pattern** — Redux id → SWR fetch → Redux entity.
- **Wrapper-block** — feature sub-component that adapts feature data into a block's contract.
- **Envelope** — GraphQL response wrapper (`result.data.<op>`) carrying `success`/`error`/`message`.
