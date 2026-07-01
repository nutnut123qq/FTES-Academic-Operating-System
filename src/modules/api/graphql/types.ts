/** Standard API wrapper around resolver payloads (`success`, `message`, optional `error`, nested `data`). */

export interface GraphQLResponse<TData = undefined> {
    success: boolean
    message: string
    error?: string
    data?: TData
}

/** Header names used for MFA or OTP flows when calling protected operations. */
export enum GraphQLHeadersKey {
    XCourseId = "X-Course-Id",
    XLocale = "X-Locale",
    /** Same meaning as server refresh short-circuit (`src/refresh-token/refresh-token.resolver.ts`). */
    XMinValiditySeconds = "X-Min-Validity-Seconds",
}

export type GraphQLHeaders = Partial<Record<GraphQLHeadersKey, string>> & Record<string, string | undefined>

/**
 * Per-operation options: optional `signal` is forwarded to `createApolloClient({ signal })`
 * so the HTTP link aborts the underlying `fetch` (e.g. SWR revalidation / cleanup).
 */
export interface GraphQLOperationContext {
    /** Optional abort signal. */
    signal?: AbortSignal
}

/** Generic query helper shape (variant, extra headers, bearer token). */
export interface QueryParams<TQuery, TRequest = undefined> extends GraphQLOperationContext {
    /** The query to call. */
    query?: TQuery
    /** The request object to pass to the query. */
    request?: TRequest
    /** Optional headers to pass to the query. */
    headers?: GraphQLHeaders
    /** When `true`, logs the Apollo link chain flow (DynamicAuthLink, AuthRefreshLink) to console. */
    debug?: boolean
}

export interface MutateParams<TMutation, TRequest> extends GraphQLOperationContext {
    /** The mutation to call. */
    mutation?: TMutation
    /** The request object to pass to the mutation. */
    request: TRequest
    /** Optional headers to pass to the mutation. */
    headers?: GraphQLHeaders
    /** Optional bearer token to pass to the mutation. */
    token?: string
    /** When `true`, logs the Apollo link chain flow (DynamicAuthLink, AuthRefreshLink) to console. */
    debug?: boolean
}

export interface MutateVariables<TRequest> {
    request: TRequest
}

/** Variables bag when the operation expects a single `request` object. */
export interface QueryVariables<TRequest> {
    request: TRequest
}



/** Allowed sort keys for paginated course lists (GraphQL `SortBy`). */
export enum SortBy {
    Title = "title",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

/** Sort direction sent to the API (GraphQL enum). */
export enum SortOrder {
    Asc = "ASC",
    Desc = "DESC",
}

/** Sort input. */
export interface SortInput<T extends string> {
    by: T
    order: SortOrder
}

/** Page size, index, and sort clauses for `courses` (`CoursesPaginationFilters`). */
export interface PaginationFilters<T extends string> {
    pageNumber?: number
    limit?: number
    sorts: Array<SortInput<T>>
    /** Optional server-side full-text search string. */
    search?: string
}

/** Request object with optional abort signal. */
export interface AbortableRequest<TRequest = undefined> {
    /** Optional request object. */
    request?: TRequest
    /** Optional abort signal. */
    signal?: AbortSignal
}