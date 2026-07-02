## Context

- FE-only Next.js app with mock SWR data. Resources render in `src/components/features/resource/{ResourceHub,ResourceDetail}/`; courses in `src/components/features/course/{CourseCatalog,CourseDetail}/`. Hub/catalog use feature-local mock hooks (`useQueryResourceHubSwr`, `useQueryCoursesSwr`).
- Unused API infra exists: `src/modules/api/graphql/mutations/mutation-toggle-favorite.ts` (`ToggleFavouriteRequest { contentId, isFavorite }`), `query-saved-contents.ts` (skip/take/search, content-shaped rows), hooks `useMutateToggleFavoriteSwr` (throws unless Redux `state.course.entity.id` is set — course-context-bound) and `useQuerySavedContentsSwr` (auth-gated, paginated, unused).
- The account menu (`src/components/layouts/shell/Navbar/AccountMenuDropdown/MenuList/`) already shows an auth-only "Đã lưu" item routing to `pathConfig().locale().profile().bookmarks()` = `/profile/settings/bookmarks`, which has **no page** — a dead link. i18n already has `bookmarks.*` keys ("Đã lưu", "Bookmark", "Tìm trong bookmark").
- House rules: OpenSpec per change; new FE code via `starci-fe-cannon-apply`; skeletons mirror real layout (HeroUI `Skeleton`); verify with `npm run build` (webpack) + `tsc --noEmit`.

## Goals / Non-Goals

**Goals**
- One shared `SaveButton` block usable on any card/detail surface for two entity types.
- A working `/saved` page fed by the same mock store, with tabs/search/unsave.
- Fix the dead account-menu bookmark link.
- Record the BE contract assumption so future wiring is a drop-in.

**Non-Goals**
- No real BE calls; no changes to the existing GraphQL modules or their hooks.
- No collections/folders, notes, or sharing of saved lists.
- No save on lesson/content level (existing `toggleFavourite` targets lesson contents — out of scope here).
- No profile-tab surface for saved items (account-menu entry only, this change).

## Decisions

1. **Generalized FE mock contract `{ entityType: "resource" | "course", entityId, isFavorite }`** — not the existing `ToggleFavouriteRequest { contentId }`.
   - Why: the real mutation is lesson-content-scoped AND its hook hard-requires Redux `courseId` (throws "Course id not found" otherwise) — unusable from ResourceHub or CourseCatalog. Saving a *course itself* has no `contentId` at all.
   - **BE assumption (explicit):** backend will eventually expose `toggleSaved(entityType, entityId)` + `savedItems(entityType?, skip, take, search)` cross-entity and user-scoped (no `X-Course-Id` header). Until then everything is mocked; `useMutateToggleFavoriteSwr` / `useQuerySavedContentsSwr` stay untouched as the future wiring reference.
   - Alternative considered: extend the existing hooks — rejected; would mutate a contract we don't own and still can't represent courses.

2. **Mock persistence = Zustand store + `localStorage`** (key e.g. `ftes.savedItems.v1`, value: array of `{ entityType, entityId, savedAt }`).
   - Why: survives reload (the persistence expectation in specs), shared instantly across all surfaces and the `/saved` page without SWR cache plumbing, and matches the house pattern of Zustand for client-only cross-component state.
   - Alternative: SWR mutate on a mock key — rejected; per-key revalidation adds ceremony for purely local data.
   - SWR cache strategy for when BE lands: toggle mutation optimistically updates the saved-store, then `mutate` the `QUERY_SAVED_CONTENTS_SWR`-family keys; detail/card surfaces read saved-state from the store (single source), so no per-card queries need invalidation.

3. **Shared `SaveButton` block** (`components/blocks` tier per house canon): icon-only HeroUI `Button` (`isIconOnly`, `variant="ghost"`), phosphor/gravity bookmark icon — outline when unsaved, filled + accent when saved; `aria-pressed={saved}`, `aria-label` = "Lưu"/"Bỏ lưu" (i18n). Optimistic: store flips synchronously (no spinner). Guest press → open the existing auth/login popup overlay (house auth-gate pattern), do NOT toggle.
   - Rendered by feature components; the block owns icon/state/gating, features pass `entityType` + `entityId` only.

4. **Route `/saved`** (`src/app/[locale]/saved/page.tsx`) + `pathConfig().locale().saved()` builder; repoint the MenuList bookmarks item there.
   - Why `/saved` over the pre-encoded `/profile/settings/bookmarks`: saved items are a library, not an account setting; short top-level route matches "Đã lưu" as a destination. The old `bookmarks()` path builder is left in place but no longer referenced by the menu (removing it is cleanup for a later change).
   - Page is auth-gated: guests get an inline sign-in prompt state, not a redirect loop.

5. **Saved page composition**: feature `SavedLibrary` with type tabs (Tất cả / Tài liệu / Khoá học — icon+label, label hidden `<sm` per house tab rule), client-side title search, list rows reusing the visual language of ResourceHub rows / CourseCatalog cards, each row carrying `SaveButton` for unsave-in-place (row disappears immediately), per-tab empty states with a CTA linking to `/resources` or `/courses`. Skeleton mirrors the row list (HeroUI `Skeleton`, gated on the mock-hydration flag so `localStorage` read never flashes).
   - Mock detail: saved ids join against the same mock datasets used by hub/catalog to resolve titles/subtitles; unknown ids are dropped silently.

## Risks / Trade-offs

- [Mock store diverges from future BE shape] → contract + assumption pinned in this doc and in the hook's TSDoc; store API mirrors the assumed mutation signature so wiring is a fetcher swap.
- [`localStorage` unavailable/SSR] → store hydrates in an effect with an `isHydrated` flag; surfaces render unsaved/skeleton until hydrated; writes wrapped in try/catch.
- [ResourceHub/CourseCatalog mock ids unstable across sessions] → mock datasets use fixed string ids (verify during implementation; if generated, pin them).
- [Two "bookmark" routes confuse future devs] → menu points only at `/saved`; dead `bookmarks()` builder documented here as legacy.

## Migration Plan

FE-only, additive; no data migration. Rollback = revert the commit (localStorage key is namespaced and ignorable). When BE ships the generalized contract, replace the store's toggle/list internals with the real mutation/query and drop `localStorage`.

## Open Questions

- Should saving a course also appear in the activity feed (`lessonBookmarked`-style notification exists for lessons)? Deferred — no event emission in this change.
- Exact icon (Bookmark vs Heart): default Bookmark to match the existing account-menu icon (`BookmarkSimpleIcon`); confirm at implementation with the design skill.
