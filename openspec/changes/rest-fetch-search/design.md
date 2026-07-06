## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, `blog`, `career`, and `event`. The backend search domain in `vn.ftes.aos.search.web` exposes two REST controllers:

- `SearchController` — `/api/v1/search` (global search) and `/api/v1/search/suggest` (query suggestions).
- `AdminReindexController` — `/api/v1/admin/search/reindex` (trigger + status).

The frontend has a GraphQL `autocompleteGlobalSearch` query, but it only covers a shallow global autocomplete grouped by entity type. It does not expose full search with keyword/semantic/nl modes, per-type filters, query suggestions, or reindex operations. Therefore every search REST endpoint is implemented.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/search/` for all search endpoints.
- Add SWR query wrappers for read endpoints (`search`, `suggest`, `reindex status`).
- Add SWR mutation wrappers for the reindex write endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./search`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL-covered shallow autocomplete; keep using `queryAutocompleteGlobalSearch` for that use case.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. Search needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/search/`
**Rationale:** Mirrors the backend package `search.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Implement every search REST endpoint
**Rationale:** GraphQL only provides shallow autocomplete. Full search, suggestions, and reindex are unavailable in GraphQL, so they are fully exposed via REST.

### 4. Types derived from `SearchViews` and `DocType`
**Rationale:** `SearchDocType` mirrors the backend `DocType` enum values (`user`, `subject`, `topic`, `course`, `resource`, `post`, `group`, `challenge`, `event`, `blog_post`). The backend normalizes the comma-separated `types` parameter with `toUpperCase(Locale.ROOT)`, so lower-cased literals are valid and easier for UI code to read.

### 4. Types inferred from `SearchViews.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps. Free-form attributes (`attrs`, `parsedQuery`) are typed as `unknown` because their shape is controlled by the search index.

## Risks / Trade-offs

- **[Risk]** Admin reindex requires `search.reindex`; callers must ensure admin UIs hold the appropriate permission.
- **[Risk]** The `attrs` and `parsedQuery` fields are intentionally loose (`unknown`) since the backend search index may return arbitrary metadata. UI code must narrow these before use.
- **[Risk]** The backend `SearchController` accepts `types` and `filters` as encoded query-string values (CSV and JSON respectively). The client must serialize them; passing arrays/objects directly would fail Spring binding.
- **[Trade-off]** We expose `search` and `suggest` as separate functions even though both are GET reads, because they return different response shapes and serve different UX purposes.

## Affected Files / Modules

- `src/modules/api/rest/search/types.ts`
- `src/modules/api/rest/search/search.ts`
- `src/modules/api/rest/search/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
