# Tasks — Global Search Redesign

## 1. Shared query plumbing

- [ ] 1.1 Add `useDebouncedValue` hook (300 ms) under the house hooks tree; unit-safe, no deps beyond React
- [ ] 1.2 Extend `useAutocompleteGlobalSearchSwr`: key on debounced query, gate on `trimmed.length >= 2`, gate on `overlayOpen || onSearchPage` (accept an `enabled` input instead of reading only the overlay), keep Redux `setGlobalSearchResults` sync
- [ ] 1.3 Add `lessonVideos` group to `query1` in `query-autocomplete-global-search.ts` (fields matching the other groups); if BE rejects the field, drop `LessonVideoEntity` from `DEFAULT_ENTITIES` and record it in design
- [ ] 1.4 Add `buildSearchHref(kind, item)` routing module per design D4 (prefer server `path`, else `parentPath`; return `null` when unroutable) + entity-kind icon/label map
- [ ] 1.5 Add `useRecentSearches` hook: `localStorage` key `ftes.search.recent`, MRU max 8, dedupe, trim, try/catch degrade
- [ ] 1.6 Verify: `npm run build` green + `tsc --noEmit` clean

## 2. Command-palette overlay (Ctrl/K)

- [ ] 2.1 Scaffold `features/search/SearchOverlay/` via `starci-fe-cannon-apply`: HeroUI Modal top-aligned `max-w-xl` on `sm:`, full-screen sheet below `sm`, driven by `useSearchOverlayState()`; mount once in the shell overlay container
- [ ] 2.2 Register global Ctrl/Cmd+K keydown (open + preventDefault, skip when another modal open) and Esc close with focus restore
- [ ] 2.3 `SearchOverlayInput`: flat input in palette box (composer-in-box exception), writes Redux `setSearchQuery`, clears on close; loading spinner slot
- [ ] 2.4 `SearchOverlayResults` + `SearchResultRow`: grouped sections in canonical order, entity icon + title + `parentPath` breadcrumb, omit empty groups; unroutable rows inert
- [ ] 2.5 Keyboard navigation: ArrowUp/ArrowDown across group boundaries with wrap, Enter activates, hover syncs active option; navigation closes overlay
- [ ] 2.6 Empty-query state: `SearchRecentQueries` (list, select re-runs, clear-all) + typing hint when empty; record query to recents on result activation and see-all
- [ ] 2.7 `SearchOverlayFooter`: "See all results" → `/search?q=<query>` (Enter with no active option does the same); kbd hints row
- [ ] 2.8 States: loading (keep stale results), inline error + retry, no-results with query echo, unauthenticated sign-in prompt (auth login popup trigger)
- [ ] 2.9 A11y combobox pattern: `role="combobox"` + `aria-expanded` + `aria-activedescendant` on input, `role="listbox"`/`role="option"` rows, DOM focus stays in input
- [ ] 2.10 i18n: add `search.*` message tree (labels, group headings, recents, hints, errors) in vi + en
- [ ] 2.11 Verify: `npm run build` green + `tsc --noEmit` clean

## 3. `/search` page rewrite

- [ ] 3.1 Replace mock `useQuerySearchSwr` with (a) real hook reuse at `size: 24` and (b) new clearly-marked mock provider for users/posts/groups/resources shaped like a future BE contract; map both into the shared row model `{ id, kind, title, snippet?, breadcrumb?, href }`
- [ ] 3.2 URL-driven query: seed input/Redux from `?q=` on load, `router.replace` the param on debounced typing; overlay handoff pre-fills correctly
- [ ] 3.3 Rewrite `SearchResults` sections on the row model: real entity groups + mock community groups, localized headings, breadcrumb line, deep links via `buildSearchHref`
- [ ] 3.4 `SearchCategoryTabs`: All + per-category tabs with count badges, zero-hit tabs disabled, label hidden `<sm` with `aria-label` kept
- [ ] 3.5 `SearchHighlight`: case-insensitive `<mark>` highlight shared by title/snippet renderers
- [ ] 3.6 Per-category "show more": initial 5 rows, reveal remainder client-side
- [ ] 3.7 States: layout-mirroring skeleton while loading, inline error + retry for real categories (mock categories unaffected), no-results, unauthenticated sign-in prompt replacing real categories only
- [ ] 3.8 i18n: update `searchPage.*` tree (new groups, tabs, showMore, signIn prompt) vi + en; drop dead `subjects` keys
- [ ] 3.9 Delete the old mock `useQuerySearchSwr` and any now-dead types/imports
- [ ] 3.10 Verify: `npm run build` green + `tsc --noEmit` clean

## 4. Final verification

- [ ] 4.1 Manual pass (dev): Ctrl/K open/close, debounce, keyboard nav, recents add/clear, see-all handoff, each entity kind routes correctly, mobile full-screen, vi/en strings
- [ ] 4.2 Run `openspec validate --change "global-search-redesign"`; final `npm run build` + `tsc --noEmit` clean
