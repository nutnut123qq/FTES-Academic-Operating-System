import { createAuthApolloClient } from "../clients"
import { type GraphQLOperationContext, type GraphQLHeaders } from "../types"
import { DocumentNode, gql } from "@apollo/client"

/**
 * Real BE global search — GraphQL `search(q: String!, types: [SearchType!], page: PageInput): SearchResult!`
 * (schema.graphqls §search). Returns the `SearchResult` DIRECTLY (NO `{success,message,error,data}`
 * envelope) — the resolver hands back the domain type.
 *
 * ⚠️ Two BE quirks handled here (verified against apitest, 2026-07-07):
 *  1. The pre-GraphQL security filter 401s ANY operation that declares a NON-NULL variable
 *     (`$q: String!`). So `q` is INLINED as a `JSON.stringify`'d literal (a valid, injection-safe
 *     GraphQL string) and `types` is INLINED as a fixed enum-literal list. Only the NULLABLE
 *     `$page: PageInput` is passed as a variable.
 *  2. The resolver can emit a `BLOG_POST` bucket whose value is NOT declared in `enum SearchType`
 *     → selecting `type` on an UNRESTRICTED query throws a serialization error and nulls the whole
 *     result. We sidestep it by requesting ONLY the declared, FE-mappable types.
 */

/** Declared `SearchType` enum values (schema). */
export type SearchType =
    | "USER"
    | "SUBJECT"
    | "TOPIC"
    | "COURSE"
    | "RESOURCE"
    | "POST"
    | "GROUP"
    | "CHALLENGE"
    | "EVENT"

/** One search hit (BE `SearchHit`). Only `docId`/`type`/`score` are non-null. */
export interface SearchHit {
    /** Opaque document id (stable key). */
    docId: string
    /** Which bucket this hit belongs to. */
    type: SearchType
    /** Display title (nullable). */
    title: string | null
    /** Matched snippet (nullable). */
    snippet: string | null
    /** Route slug used to deep-link the hit (nullable). */
    slug: string | null
    /** Relevance score. */
    score: number
}

/** One result bucket for a type (BE `SearchGroup`). */
export interface SearchGroup {
    /** The bucket's entity type. */
    type: SearchType
    /** Total matches for this type (may exceed `hits.length`). */
    total: number
    /** The returned page of hits. */
    hits: Array<SearchHit>
}

/** Full search result (BE `SearchResult`). */
export interface SearchResult {
    /** Search mode reported by the BE (e.g. `keyword`). */
    mode: string
    /** One bucket per requested type. */
    groups: Array<SearchGroup>
}

/** Apollo response shape for `search` (returned directly — no envelope). */
export interface QuerySearchResponse {
    /** Top-level `search` field returning the `SearchResult` directly. */
    search: SearchResult
}

/**
 * Types requested (INLINED). Only the buckets that map to a FE category; excludes
 * SUBJECT/TOPIC/EVENT (no FE surface) and the undeclared BLOG_POST (serialization bug).
 */
const REQUESTED_TYPES = "[COURSE, CHALLENGE, USER, POST, GROUP, RESOURCE]"

/** Optional page (BE `PageInput`); NULLABLE so the non-null-variable filter never 401s. */
export interface SearchPageInput {
    /** Zero-based page index. */
    page?: number | null
    /** Page size (caps hits per bucket). */
    size?: number | null
}

/** Params for {@link querySearch}. */
export interface QuerySearchParams extends GraphQLOperationContext {
    /** The user query. Inlined safely via `JSON.stringify` (BE 401s a `$q: String!` variable). */
    q: string
    /** Page (`page`/`size`). */
    page?: SearchPageInput
    /** Optional per-operation headers. */
    headers?: GraphQLHeaders
    /** Enable Apollo debug logging. */
    debug?: boolean
}

/** Build the search document with `q` + `types` INLINED (see the non-null-variable quirk above). */
const searchDocument = (q: string): DocumentNode =>
    gql(
        `query GlobalSearch($page: PageInput) {\n` +
            `  search(q: ${JSON.stringify(q)}, types: ${REQUESTED_TYPES}, page: $page) {\n` +
            `    mode\n` +
            `    groups {\n` +
            `      type\n` +
            `      total\n` +
            `      hits { docId type title snippet slug score }\n` +
            `    }\n` +
            `  }\n` +
            `}`,
    )

/**
 * Runs the real BE `search` for `q`. Requires auth (the gateway 401s guests).
 * @param params - the query string, optional page, headers, debug, and abort signal.
 * @returns Apollo query result; the payload is at `data.search` (returned directly, no envelope).
 */
export const querySearch = async ({ q, page, headers, debug, signal }: QuerySearchParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QuerySearchResponse>({
        query: searchDocument(q),
        variables: { page: page ?? null },
    })
}
