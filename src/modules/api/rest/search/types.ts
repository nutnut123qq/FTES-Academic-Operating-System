/**
 * Request/response DTOs for the search REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.search.web.dto.SearchViews`
 * and the `DocType` enum in `vn.ftes.aos.search.api.DocType`.
 */

export type SearchMode = "keyword" | "semantic" | "nl"

/**
 * Lower-cased names of the backend `DocType` enum.
 * Sent to the backend as a comma-separated list; the backend normalizes
 * the values with `toUpperCase(Locale.ROOT)` before parsing.
 */
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

/**
 * Per-type filter object encoded as a JSON string by the client.
 * Shape on the backend: `{"TYPE":{"key": value}}`.
 */
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
