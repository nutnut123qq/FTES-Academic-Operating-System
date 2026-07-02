## Why

`/search` was 404 — §16 Search Platform had no landing surface, so there was nowhere
to run a global query across the app's domains (users, subjects, courses, resources,
community posts). This ships the results page (FE-only mock shell), turning `/search`
into a real 200 route with a single input that groups hits by category.

## What Changes

- Add `features/search/SearchResults` + `[locale]/search/page.tsx`: one controlled
  search input driving grouped result sections (users / subjects / courses / resources
  / posts), each row = icon + title + subtitle linking into the relevant domain
  (`/profile`, `/subjects`, `/courses`, `/resources`, `/community`).
- Add `useQuerySearchSwr(query)` — mock grouped results, SWR-shaped + keyed by query.
- Empty state ("type to search") before typing; no-results state when nothing matches.
- Add `searchPage.*` i18n (en/vi) — output in the report; messages/*.json NOT edited
  here (shared file, edited separately).

## Capabilities

### New Capabilities
- `search-results`: the global search results page at `/search`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/search/SearchResults`, `search/page.tsx`, `useQuerySearchSwr`.
  No BE (mock). No shared-file edits (nav / path / layout untouched in this change).
