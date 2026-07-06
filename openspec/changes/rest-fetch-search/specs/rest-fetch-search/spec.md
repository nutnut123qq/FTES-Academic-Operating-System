## Purpose

Provide a typed REST client and SWR hooks for the search/reindex REST controllers in `vn.ftes.aos.search.web`, enabling full-text global search, search suggestions, and admin reindex jobs while reusing the shared `restRequest` client.

## API Surface

### `src/modules/api/rest/search/types.ts`

```ts
export type SearchMode = "keyword" | "semantic" | "nl"

export type SearchDocType =
    | "user"
    | "subject"
    | "topic"
    | "course"
    | "resource"
    | "post"
    | "group"
    | "challenge"
    | "event"
    | "blog_post"

export type SearchFilters = Record<string, unknown>

export interface SearchRequest {
    q: string
    types?: SearchDocType[]
    filters?: SearchFilters
    mode?: SearchMode
    page?: number
    size?: number
    nlStrict?: boolean
}

export interface SearchHitView {
    docId: string
    type: SearchDocType
    title: string
    highlight?: string
    snippet?: string
    slug?: string
    thumbnail?: string
    score: number
    attrs?: Record<string, unknown>
}

export interface SearchGroupView {
    type: SearchDocType
    total: number
    hits: SearchHitView[]
}

export interface SearchResponse {
    groups: SearchGroupView[]
    mode: SearchMode
    parsedQuery?: unknown
}

export interface SuggestRequest {
    q: string
    types?: string
    limit?: number
}

export interface SuggestResponse {
    suggestions: string[]
}

export type ReindexDocType = SearchDocType

export type ReindexStatus = "pending" | "running" | "completed" | "failed"

export interface ReindexJobView {
    jobId: string
    docType?: ReindexDocType
    status: ReindexStatus
    total: number
    processed: number
    error?: string
}

export interface ReindexRequest {
    docType?: ReindexDocType
}
```

### `src/modules/api/rest/search/search.ts`

```ts
export const search = (request: SearchRequest): Promise<SearchResponse>
export const suggest = (request: SuggestRequest): Promise<SuggestResponse>
export const reindex = (request?: ReindexRequest): Promise<ReindexJobView>
export const getReindexJob = (jobId: string): Promise<ReindexJobView>
```

Notes:
- `search` serializes `types` as a comma-separated string and `filters` as a JSON string to match the backend `@RequestParam` expectations.
- All search endpoints require an authenticated user (`/api/v1/**` is authenticated).
- `reindex` and `getReindexJob` require the `search.reindex` permission.

### SWR Hooks

| Hook | File | Type | Key |
|------|------|------|-----|
| `useGetSearchSwr` | `src/hooks/swr/api/rest/queries/useGetSearchSwr.ts` | query | `["GET_SEARCH_SWR", request]` |
| `useGetSearchSuggestionsSwr` | `src/hooks/swr/api/rest/queries/useGetSearchSuggestionsSwr.ts` | query | `["GET_SEARCH_SUGGESTIONS_SWR", request]` |
| `useGetReindexJobSwr` | `src/hooks/swr/api/rest/queries/useGetReindexJobSwr.ts` | query | `["GET_REINDEX_JOB_SWR", jobId]` |
| `usePostReindexSwr` | `src/hooks/swr/api/rest/mutations/usePostReindexSwr.ts` | mutation | `"POST_REINDEX_SWR"` |

## Acceptance Criteria

1. `src/modules/api/rest/search/search.ts` exports typed functions matching the controller endpoints.
2. `src/modules/api/rest/search/types.ts` mirrors the backend DTO shapes.
3. `src/modules/api/rest/index.ts` re-exports `./search`.
4. Query and mutation SWR hooks exist and correctly call the clients.
5. `npx tsc --noEmit` exits cleanly.
6. `npm run build -- --webpack` exits cleanly.

## Out of Scope

- UI components/pages using search.
- Replacing `queryAutocompleteGlobalSearch` GraphQL usage.
- Backend controller changes.
- New npm dependencies.
