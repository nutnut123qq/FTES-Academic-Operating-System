# Global Search Redesign

## Why

Global search is currently two disconnected halves: the navbar `SearchButton` opens a search
overlay (Zustand `useSearchOverlayState` + Ctrl/K) and a REAL autocomplete contract already
exists (`useAutocompleteGlobalSearchSwr` → `autocompleteGlobalSearch`, 8 learning entities with
`parentPath` breadcrumbs, synced to Redux) — but **no results UI renders anywhere for it**.
Meanwhile `/search` is an old standalone mock (5 hard-coded categories via `useQuerySearchSwr`)
that ignores the real contract entirely. Users press Ctrl/K and get a dead overlay; the redesign
unifies both surfaces on one contract.

## What Changes

- **New command-palette overlay** (Ctrl/K or navbar click): search input + results grouped by
  entity type (courses, modules, contents, lesson videos, challenges, milestones, milestone
  tasks, flashcard decks), recent searches persisted in `localStorage`, full keyboard navigation
  (↑ ↓ Enter Esc), "See all results" footer routing to `/search?q=…`, mobile full-screen
  variant, combobox ARIA pattern, i18n vi/en.
- **Redesigned `/search` page** unified with the real autocomplete contract for learning
  entities; community-domain categories the BE does not index yet (users, posts, groups,
  resources) stay MOCK behind the same UI (assumption noted); category filter tabs, matched-term
  highlighting, `parentPath` breadcrumb display, load-more pagination.
- **BREAKING**: the old mock-only `/search` page (`SearchResults` + `useQuerySearchSwr` 5-category
  contract: users/subjects/courses/resources/posts) is replaced; the `subjects` category is
  dropped in favor of real entity groups.
- Shared query behavior: 300 ms debounce, min 2 characters, loading/empty/error states,
  auth-gated real fetch (unauthenticated → sign-in prompt in overlay/page).
- Entity routing: each result type deep-links to its canonical route via `path`/`parentPath`.

## Capabilities

### New Capabilities

- `search-command-palette`: the Ctrl/K search overlay — open/close, debounced autocomplete,
  grouped results, recent searches, keyboard navigation, entity routing, mobile full-screen,
  a11y and i18n.

### Modified Capabilities

- `search-results`: `/search` page requirements change from 5 mock categories to unified
  real-contract entity groups + mocked community categories, with filter tabs, highlighting,
  breadcrumbs, pagination, and URL-driven query (`?q=`).

## Impact

- **Code**: new overlay feature components under the shell/search feature tree; rewrite of
  `src/components/features/search/SearchResults/`; navbar `SearchButton` unchanged as trigger;
  `useAutocompleteGlobalSearchSwr` extended (debounce/min-chars gating); Redux `search` slice
  (query) and `socketio.globalSearchResults` remain the sync points; Zustand overlay key
  `search` reused; new `localStorage` key for recent searches; i18n messages vi/en.
- **APIs**: consumes existing `autocompleteGlobalSearch` GraphQL query only — no BE changes.
  Users/posts/groups/resources search remains FE mock until BE indexes those entities
  (assumption recorded in design).
- **Specs**: existing `openspec/specs/search-results` modified; new `search-command-palette`.
