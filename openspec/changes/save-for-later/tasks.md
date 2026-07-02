## 1. Mock save store + contract

- [x] 1.1 Create the saved-items Zustand store (`{ entityType: "resource" | "course" | "post", entityId, savedAt, source? }[]`, `isHydrated` flag) with `toggleSaved` / `isSaved` selectors and namespaced `localStorage` persistence (`ftes.savedItems.v1`, try/catch, hydrate-in-effect) — post entries carry `source: { kind: "community" | "group" | "subject", id?, label }` per design.md; follow house canon via `starci-fe-cannon-apply`; record the BE assumption from design.md in TSDoc → `src/hooks/zustand/savedItems/{store,hooks,index}.ts`
- [x] 1.2 Add i18n keys (vi + en): save/unsave accessible names, saved-page title, tabs (incl. "Bài viết"), search placeholder, empty states (incl. posts-tab), sign-in prompt, CTAs, post source-context labels (reuse `bookmarks.*` where copy matches) → `savedItems.*` namespace in `vi.json`/`en.json`
- [x] 1.3 Verify: `npm run build` green (build: batch-verified by orchestrator) + `tsc --noEmit` clean

## 2. Shared SaveButton block

- [x] 2.1 Build `SaveButton` block (icon-only HeroUI Button, Threads visual language: thin bookmark icon, outline/filled, no border or fill on the button, `aria-pressed`, i18n `aria-label`, optimistic store toggle, press does not propagate to parent card links) → `src/components/blocks/buttons/SaveButton/index.tsx`
- [x] 2.2 Auth-gate: unauthenticated press opens the existing login popup overlay (AuthenticationModal via `useAuthenticationOverlayState`) and does not toggle (applies to all entity types, incl. the post action-bar 🔖)
- [x] 2.3 Verify: `npm run build` green (build: batch-verified by orchestrator) + `tsc --noEmit` clean

## 3. Place toggles on surfaces

- [x] 3.1 Render `SaveButton` on each ResourceHub row and in the ResourceDetail header (entityType "resource"); confirm mock resource ids are stable across sessions (h1–h6 hardcoded in `useQueryResourceHubSwr` — stable, no pinning needed)
- [x] 3.2 Render `SaveButton` on each CourseCatalog card and in the CourseDetail header (entityType "course"); card navigation still works (the block swallows the press so it never reaches the card `Link`)
- [x] 3.3 Wire post saving: `post-engagement` has NOT landed → delivered the store binding + documented integration point (SaveButton supports `entityType="post"` + `source` capture; integration contract documented in the SaveButton + store TSDoc — the bar's 🔖 renders `<SaveButton entityType="post" …/>` or calls `useSavedItemsStore`/`useIsSaved` directly); no post-surface files touched
- [x] 3.4 Verify: `npm run build` green (build: batch-verified by orchestrator) + `tsc --noEmit` clean

## 4. Saved page /saved

- [x] 4.1 Add `saved()` builder to `src/resources/path/index.ts` and route `src/app/[locale]/saved/page.tsx` rendering a new `SavedLibrary` feature
- [x] 4.2 Build `SavedLibrary`: newest-first list joining store ids against the hub/catalog/post mock datasets (drop unknown ids), type tabs (Tất cả/Tài liệu/Khoá học/Bài viết, icon+label with label hidden `<sm` + `aria-label`), case-insensitive search (title; author+snippet for posts), rows linking to detail pages with `SaveButton` for unsave-in-place
- [x] 4.2b Posts tab rows: author (avatar + name), clamped content snippet (`line-clamp-2`), source-context line from stored `source` metadata (Cộng đồng / group name / subject name), link to post detail, unsave-in-place
- [x] 4.3 States: guest inline sign-in prompt (EmptyState + login-popup CTA), never-saved empty state with browse CTA per tab (resources/courses/community feed for posts), no-results search state, hydration skeleton mirroring the row list (HeroUI Skeleton, heading/tabs/search outside skeleton)
- [x] 4.4 Repoint the account-menu "Đã lưu" item in `AccountMenuDropdown/MenuList` from `profile().bookmarks()` to the new `saved()` path
- [x] 4.5 Verify: `npm run build` green (build: batch-verified by orchestrator) + `tsc --noEmit` clean

## 5. Final verification

- [x] 5.1 Walk the spec scenarios in `npm run dev`: resource/course toggles, cross-surface consistency, reload persistence, guest gating, tabs/search/unsave/empty/skeleton on `/saved`, menu entry navigates (no 404), vi/en strings (runtime walk: batch-verified by orchestrator; post action-bar 🔖 scenarios pending `post-engagement` landing — store side ready)
- [x] 5.2 Final gate: `npm run build` (webpack) green (build: batch-verified by orchestrator) + `tsc --noEmit` clean; `openspec validate save-for-later` passes
