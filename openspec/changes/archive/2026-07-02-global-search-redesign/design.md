# Design — Global Search Redesign

## Context

Current state (verified in source):

- `src/components/layouts/shell/Navbar/SearchButton/index.tsx` — HeroUI `Button` with Ctrl/K
  `Kbd` hint; `onPress` calls `useSearchOverlayState().open()`. No overlay body exists — the
  open state currently renders nothing.
- `src/hooks/swr/api/graphql/queries/useAutocompleteGlobalSearchSwr.ts` — real BE hook. SWR key
  gated on `keycloak.authenticated && isOpen`; reads `state.search.query` (Redux `search`
  slice); calls `queryAutocompleteGlobalSearch` with 8 `SearchableEntity` names, `size: 8`;
  dispatches `setGlobalSearchResults` into the `socketio` slice. Mounted via `SwrSideEffects`.
- `src/modules/api/graphql/queries/query-autocomplete-global-search.ts` — response groups:
  `courses | modules | challenges | contents | lessonVideos | flashcardDecks | milestones |
  milestoneTasks`, each item `{ id, displayId, title, texts, parentPath, path? }`.
  `parentPath` carries the ancestor chain (course/module/content/challenge/task refs);
  `path` is a server-built canonical route (nullable). NOTE: the current gql document selects
  only 7 groups — `lessonVideos` is missing from the selection set even though
  `LessonVideoEntity` is requested; the redesign must add it.
- `src/components/features/search/SearchResults/index.tsx` — old `/search` page: local
  `useState` query, mock `useQuerySearchSwr`, 5 hard-coded categories (users, subjects,
  courses, resources, posts), rows link to category index pages only (no deep links).
- Spec `openspec/specs/search-results` describes the old mock page.

Constraints: FE-only repo (mock BE contracts where real ones are missing, record assumptions);
house canon (`starci-fe-cannon-apply`) for all new components; HeroUI + tokens; i18n vi/en;
`npm run build` (webpack) + `tsc --noEmit` must stay green.

## Goals / Non-Goals

**Goals**

- One search experience: overlay (quick jump) and `/search` (exhaustive) on the same contract.
- Command-palette UX: Ctrl/K, keyboard-first, recent searches, grouped results, deep links.
- Keep the real `autocompleteGlobalSearch` contract untouched (BE exists; do not invent fields).
- Deterministic mock for categories the BE does not index (users, posts, groups, resources).

**Non-Goals**

- No BE/GraphQL schema changes; no new endpoints.
- No search-history sync to server (recent searches are device-local).
- No relevance tuning, fuzzy ranking, or analytics.
- Voice input, saved filters, and search-as-you-navigate are out of scope.

## Decisions

### D1 — Overlay is a modal command palette rendered at shell level

The overlay body is a new self-contained feature component (canon: feature owns data + state,
tokens own the look) mounted once in the shell next to other singleton overlays, driven by the
existing Zustand `useSearchOverlayState()` handle (key `search`). HeroUI `Modal` on `sm:` and up
(top-aligned, `max-w-xl`); full-screen sheet below `sm` (mobile). A `keydown` listener on
`window` (registered once in the shell) maps Ctrl/Cmd+K → `open()`, Esc → `close()`.

*Alternative considered*: popover anchored to the navbar button — rejected; command palettes are
viewport-centered, and the navbar button is hidden on small screens.

Component decomposition (house canon — block per folder, `index.tsx` per component):

```
features/search/
  SearchOverlay/            — modal shell, open/close, Ctrl+K wiring, aria combobox root
    SearchOverlayInput/     — flat input inside the palette box (composer-in-box exception:
                              plain <input>, outer box owns border + focus-within)
    SearchOverlayResults/   — grouped listbox: one section per non-empty entity group
      SearchResultRow/      — icon + title + parentPath breadcrumb, aria option
    SearchRecentQueries/    — recent searches list + clear action (empty-query state)
    SearchOverlayFooter/    — "See all results" link → /search?q=…, kbd hints
  SearchResults/            — /search page (rewritten)
    SearchCategoryTabs/     — All + per-category filter tabs (icon + label; label hidden <sm)
    SearchHighlight/        — shared matched-term <mark> renderer
```

### D2 — State split: Zustand = overlay visibility, Redux = query + results

Keep the existing wiring rather than inventing a third store:

- **Zustand overlay store** (`useSearchOverlayState`) — only `isOpen/open/close`. It is the
  singleton visibility handle; nothing else lives there.
- **Redux `search` slice** — the shared query string (`setSearchQuery`/`clearSearchQuery`).
  Both the overlay input and the `/search` page input write here, which is what lets the
  "See all results" handoff keep the typed query.
- **Redux `socketio.globalSearchResults`** — last grouped payload, kept as-is (already the
  sync target of the SWR hook; other consumers may read it).
- **SWR** remains the fetch/cache layer. The hook's key gains the debounced query; gating
  becomes `authenticated && (overlayOpen || onSearchPage) && debouncedQuery.length >= 2`.
  Debounce (300 ms) implemented as a small `useDebouncedValue` hook so both surfaces share it.
- **Recent searches** — `localStorage` key `ftes.search.recent` (max 8, MRU, deduped,
  trimmed). Read/write wrapped in a `useRecentSearches` hook; guarded `try/catch` for
  private-mode storage failures (fail silent → feature hidden).

*Alternative considered*: move query into Zustand too — rejected; Redux `search.query` already
exists and the SWR hook and side-effects read it.

### D3 — `/search` page unifies real + mock behind one row model

The page maps both sources into one presentational row shape
`{ id, kind, title, snippet?, breadcrumb?, href }`:

- **Real categories** (courses, modules, contents, lessonVideos, challenges, milestones,
  milestoneTasks, flashcardDecks) come from the same `autocompleteGlobalSearch` call with a
  larger `size` (24) — the BE contract has no offset pagination, so "load more" is per-category
  client-side reveal over the fetched set (assumption A2).
- **Mock categories** (users, posts, groups, resources) keep a mock SWR hook shaped like the
  future BE response (id/title/subtitle/href), clearly marked mock in code. The old
  `subjects` category is dropped (subjects are not a searchable BE entity; courses cover it).
- Query is URL-driven: `/search?q=…` is the source of truth on load (seeds Redux), typing
  updates the URL via `router.replace` after debounce — sharable/back-button-safe.
- Category tabs filter client-side: `All` plus one tab per category with a count badge; tabs
  with zero hits are disabled.
- Highlighting: case-insensitive first match of the query in title/snippet wrapped in
  `<mark>` (token styling), done in `SearchHighlight` for both surfaces.

### D4 — Entity routing table (single source, used by both surfaces)

One `buildSearchHref(kind, item)` module resolves the deep link. Prefer server `path` when
present (prepend locale); otherwise build from `parentPath`:

| Kind | Route pattern |
| --- | --- |
| course | `/courses/{course.displayId}` |
| module | `/learn/content/modules/{module.id}` |
| content | `/learn/content/modules/{module.id}/contents/{content.id}` |
| lessonVideo | content route of its parent content |
| challenge | `/learn/content/modules/{module.id}/contents/{content.id}/challenges/{challenge.id}` |
| milestone | personal-project page via `parentPath.task` |
| milestoneTask | personal-project page of owning course |
| flashcardDeck | flashcards page of owning course |

Unroutable item (no `path`, incomplete `parentPath`) → row renders non-interactive with the
breadcrumb only (never a broken link).

### D5 — Auth gating

The real contract requires auth (`createAuthApolloClient`). Unauthenticated: overlay still
opens but shows a sign-in prompt (reuse auth login popup trigger) instead of fetching; `/search`
shows the same prompt for real categories while mock categories still render (they are local).

## Risks / Trade-offs

- [BE has no paginated full-search endpoint] → `/search` uses autocomplete with `size: 24` +
  client-side reveal; recorded as assumption A2 so a future `globalSearch` endpoint can slot in
  behind the same row model.
- [Users/posts/groups/resources not indexed by BE] → mock hooks with future-shaped contracts;
  assumption A1 noted in code and spec; swap = replace hook internals only.
- [`lessonVideos` missing from current gql selection] → add the group to `query1`; if the BE
  schema rejects the field, drop `LessonVideoEntity` from `DEFAULT_ENTITIES` too (keep request
  and selection consistent).
- [Ctrl/K collides with browser/other handlers] → `preventDefault` only when the shortcut
  matches exactly and no other modal is open; Esc handled by the modal itself.
- [localStorage unavailable] → `useRecentSearches` degrades to empty + no-op writes.
- [Two inputs (overlay, page) writing one Redux query] → acceptable: surfaces are never
  focused simultaneously; overlay closes on navigation to `/search`.

## Migration Plan

1. Land overlay + hook changes (additive; dead overlay becomes functional).
2. Rewrite `/search` behind the same commit; delete `useQuerySearchSwr` mock only after the new
   page compiles (drop `subjects`; keep users/posts/groups/resources as new mock hook).
3. Update i18n `search.*`/`searchPage.*` message trees vi/en together.
4. Rollback = revert the change commit (1 OpenSpec change = 1 commit); no data migrations.

## Open Questions

- Should recent searches also store the picked result (jump again directly) or query text only?
  Spec'd as query-text-only for v1.
- Milestone/milestoneTask exact route segments must be confirmed against the personal-project
  page during implementation (routing table D4 declares intent, not final literals).
