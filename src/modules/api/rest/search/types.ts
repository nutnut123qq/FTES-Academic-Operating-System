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
 * UPPER-CASED `DocType` enum names as they appear in the RESPONSE. The backend serializes
 * a hit/group `type` with `DocType.name()` (see `SearchController.toGroup/toHit`), so the
 * response carries `"COURSE"`, `"USER"`, … — NOT the lower-cased request form above.
 */
export type SearchDocTypeName =
    | "USER"
    | "SUBJECT"
    | "TOPIC"
    | "COURSE"
    | "RESOURCE"
    | "POST"
    | "GROUP"
    | "CHALLENGE"
    | "EVENT"
    | "BLOG_POST"

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
    /** UPPER-CASED `DocType` name (BE serializes `DocType.name()`). */
    type: SearchDocTypeName
    /** Nullable on the backend (`HitView.title`); falls back to slug/docId when absent. */
    title?: string
    highlight?: string
    snippet?: string
    slug?: string
    thumbnail?: string
    score: number
    attrs?: Record<string, unknown>
}

export interface SearchGroupView {
    /** UPPER-CASED `DocType` name (BE serializes `DocType.name()`). */
    type: SearchDocTypeName
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
