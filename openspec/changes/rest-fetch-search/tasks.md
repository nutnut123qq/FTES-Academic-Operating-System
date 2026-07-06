## Tasks

- [x] 1. Scaffold `src/modules/api/rest/search/` module
  - Create `src/modules/api/rest/search/types.ts` with interfaces for `SearchRequest`, `SearchResponse`, `SearchHitView`, `SearchGroupView`, `SuggestRequest`, `SuggestResponse`, `ReindexRequest`, and `ReindexJobView`.
  - Create `src/modules/api/rest/search/search.ts` implementing `search`, `suggest`, `reindex`, and `getReindexJob` via `restRequest`.
  - Create `src/modules/api/rest/search/index.ts` barrel file.

- [x] 2. Update REST barrel
  - Add `export * from "./search"` to `src/modules/api/rest/index.ts`.

- [x] 3. Add SWR query hooks
  - Create `src/hooks/swr/api/rest/queries/useGetSearchSwr.ts` wrapping `search`.
  - Create `src/hooks/swr/api/rest/queries/useGetSearchSuggestionsSwr.ts` wrapping `suggest`.
  - Create `src/hooks/swr/api/rest/queries/useGetReindexJobSwr.ts` wrapping `getReindexJob`.
  - Update `src/hooks/swr/api/rest/queries/index.ts` barrel.

- [x] 4. Add SWR mutation hook
  - Create `src/hooks/swr/api/rest/mutations/usePostReindexSwr.ts` wrapping `reindex`.
  - Update `src/hooks/swr/api/rest/mutations/index.ts` barrel.

- [x] 5. Verify
  - Run `npx tsc --noEmit` and fix any type errors.
  - Run `npm run build -- --webpack` and fix any build errors.
