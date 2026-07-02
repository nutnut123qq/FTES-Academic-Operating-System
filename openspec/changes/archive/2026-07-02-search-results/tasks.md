## 1. Results page
- [x] 1.1 `useQuerySearchSwr(query)` — mock grouped results, SWR-shaped, keyed by query
- [x] 1.2 `features/search/SearchResults` — controlled input + grouped sections + empty/no-results states
- [x] 1.3 `[locale]/search/page.tsx` renders SearchResults

## 2. Wiring
- [x] 2.1 i18n `searchPage.{title,placeholder,empty,noResults}` + `searchPage.groups.*` (en/vi) — output in report; messages/*.json edited separately

## 3. Verify
- [x] 3.1 eslint clean (build/tsc skipped per task scope)
