## Why

Users cannot save (favorite) resources, courses, or posts to come back to later — there is no bookmark UI anywhere, even though bare API infra already exists unused (`mutateToggleFavorite`, `querySavedContents`, hooks `useMutateToggleFavoriteSwr` / `useQuerySavedContentsSwr`) and the account menu already renders a "Đã lưu" (bookmarks) item that navigates to `/profile/settings/bookmarks` — a **dead link** (no page exists). This change ships the full save-for-later loop: toggle buttons on resource/course surfaces + a Saved page, and fixes the dead menu link.

## What Changes

- New shared `SaveButton` block (thin Threads-style bookmark icon, filled when saved, no border/fill on the button, optimistic toggle, auth-gated) placed on 4 surfaces:
  - Resource row/card in `ResourceHub` and header of `ResourceDetail`.
  - Course card in `CourseCatalog` and header of `CourseDetail`.
- **Posts are the third saveable entity type.** Post saving is triggered by the 🔖 bookmark button inside the Threads-style post action bar — that button's placement/rendering is owned by the `post-engagement` change; **this change owns the save state/mechanics** (store contract, toggle behavior, guest gating, persistence) the button binds to, for community posts, group posts, and subject workspace "Thảo luận" posts.
- New "Đã lưu" (Saved) page at route `/saved` listing saved resources + courses + posts with type tabs (Tất cả / Tài liệu / Khoá học / Bài viết), title search, empty states, unsave-in-place, and loading skeletons. Saved post rows show author, content snippet, and source context (community / group / subject workspace) and link to the post detail.
- Entry points: repoint the existing account-menu "Đã lưu" item (currently the dead `/profile/settings/bookmarks` link) to `/saved`; add a `saved()` builder to `pathConfig`.
- Generalized FE mock save contract: `{ entityType: "resource" | "course" | "post", entityId, isFavorite }` — a client-side mock store keyed per entity, replacing direct use of the course-context-bound `useMutateToggleFavoriteSwr` (which throws without a Redux `courseId` — unusable cross-context). **BE assumption recorded explicitly** (see design.md); no real BE calls.
- i18n vi/en for all new strings (reuse existing `bookmarks.*` keys where they fit); a11y (`aria-pressed`, accessible names on icon-only buttons).

## Capabilities

### New Capabilities
- `content-save-toggle`: saving/unsaving a resource, course, or post — button states (Threads-style thin bookmark, filled when saved), optimistic behavior, guest gating, persistence expectation. For posts, the toggle mechanics back the 🔖 button in the post action bar owned by `post-engagement`.
- `saved-library-page`: the `/saved` page — listing, type tabs (incl. "Bài viết"), search, empty states, unsave from list, skeletons, entry points.

### Modified Capabilities
- (none — `course-detail` and other existing specs are untouched; save affordances are specified surface-by-surface inside the new capabilities.)

## Impact

- FE only, mock data — no real BE mutation is wired (existing GraphQL toggle-favorite contract is course-scoped and content-only; generalizing it is a BE ask, noted as an assumption).
- New: `src/components/blocks/SaveButton/` (or house-canon equivalent), `src/app/[locale]/saved/` page, `src/components/features/saved/SavedLibrary/`, mock save hooks.
- Touched: `ResourceHub`, `ResourceDetail`, `CourseCatalog`, `CourseDetail` (render the block only), `AccountMenuDropdown/MenuList` (link target), `src/resources/path/index.ts`, `src/messages/{vi,en}.json`.
- Cross-change dependency: the `post-engagement` change owns the post action bar (and its 🔖 button placement); this change owns the saved-items store contract, toggle mechanics, and the `/saved` library that button feeds. The store API is the integration seam between the two.
- Unused hooks `useMutateToggleFavoriteSwr` / `useQuerySavedContentsSwr` stay as-is (future BE wiring), not deleted.
- Build stays green: `npm run build` (webpack) + `tsc --noEmit`.
