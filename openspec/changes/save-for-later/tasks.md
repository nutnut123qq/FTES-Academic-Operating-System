## 1. Mock save store + contract

- [ ] 1.1 Create the saved-items Zustand store (`{ entityType: "resource" | "course" | "post", entityId, savedAt, source? }[]`, `isHydrated` flag) with `toggleSaved` / `isSaved` selectors and namespaced `localStorage` persistence (`ftes.savedItems.v1`, try/catch, hydrate-in-effect) — post entries carry `source: { kind: "community" | "group" | "subject", id?, label }` per design.md; follow house canon via `starci-fe-cannon-apply`; record the BE assumption from design.md in TSDoc
- [ ] 1.2 Add i18n keys (vi + en): save/unsave accessible names, saved-page title, tabs (incl. "Bài viết"), search placeholder, empty states (incl. posts-tab), sign-in prompt, CTAs, post source-context labels (reuse `bookmarks.*` where copy matches)
- [ ] 1.3 Verify: `npm run build` green + `tsc --noEmit` clean

## 2. Shared SaveButton block

- [ ] 2.1 Build `SaveButton` block (icon-only HeroUI Button, Threads visual language: thin bookmark icon, outline/filled, no border or fill on the button, `aria-pressed`, i18n `aria-label`, optimistic store toggle, press does not propagate to parent card links)
- [ ] 2.2 Auth-gate: unauthenticated press opens the existing login popup overlay and does not toggle (applies to all entity types, incl. the post action-bar 🔖)
- [ ] 2.3 Verify: `npm run build` green + `tsc --noEmit` clean

## 3. Place toggles on surfaces

- [ ] 3.1 Render `SaveButton` on each ResourceHub row and in the ResourceDetail header (entityType "resource"); confirm mock resource ids are stable across sessions, pin them if generated
- [ ] 3.2 Render `SaveButton` on each CourseCatalog card and in the CourseDetail header (entityType "course"); card navigation must still work
- [ ] 3.3 Wire post saving to the post action bar's 🔖 button (bar owned by the `post-engagement` change): expose the store toggle (`entityType: "post"` + source metadata capture) as the button's binding — via `SaveButton` in bar mode or the store hook directly; verify optimistic fill, guest gating, and cross-surface consistency on community/group/subject "Thảo luận" posts. If `post-engagement` has not landed, deliver the store binding + a documented integration point instead of touching its surfaces
- [ ] 3.4 Verify: `npm run build` green + `tsc --noEmit` clean

## 4. Saved page /saved

- [ ] 4.1 Add `saved()` builder to `src/resources/path/index.ts` and route `src/app/[locale]/saved/page.tsx` rendering a new `SavedLibrary` feature
- [ ] 4.2 Build `SavedLibrary`: newest-first list joining store ids against the hub/catalog/post mock datasets (drop unknown ids), type tabs (Tất cả/Tài liệu/Khoá học/Bài viết, icon+label with label hidden `<sm`), case-insensitive search (title; author+snippet for posts), rows linking to detail pages with `SaveButton` for unsave-in-place
- [ ] 4.2b Posts tab rows: author (avatar + name), clamped content snippet, source-context line from stored `source` metadata (Cộng đồng / group name / subject name), link to post detail, unsave-in-place
- [ ] 4.3 States: guest inline sign-in prompt, never-saved empty state with browse CTA per tab (resources/courses/community feed for posts), no-results search state, hydration skeleton mirroring the row list (HeroUI Skeleton, heading outside skeleton — `/starci-fe-skeleton-apply`)
- [ ] 4.4 Repoint the account-menu "Đã lưu" item in `AccountMenuDropdown/MenuList` from `profile().bookmarks()` to the new `saved()` path
- [ ] 4.5 Verify: `npm run build` green + `tsc --noEmit` clean

## 5. Final verification

- [ ] 5.1 Walk the spec scenarios in `npm run dev`: toggle on all resource/course surfaces + post action-bar 🔖 (community/group/subject), cross-surface consistency (incl. posts), reload persistence, guest gating (incl. post 🔖), tabs (incl. Bài viết)/search/unsave/empty/skeleton on `/saved`, post rows show author/snippet/source and navigate to post detail, menu entry navigates (no 404), vi/en strings
- [ ] 5.2 Final gate: `npm run build` (webpack) green + `tsc --noEmit` clean; `openspec validate --change "save-for-later"` passes
