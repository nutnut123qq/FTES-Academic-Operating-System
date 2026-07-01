import type { GraphQLResponse } from "../../types"

/** Variables for the `resolveRoute` query. */
export interface ResolveRouteRequest {
    /** Opaque global id (base64url of `<entityName>:<id>`). */
    globalId: string
}

/** Payload inside `resolveRoute.data` after the standard API wrapper. */
export interface QueryResolveRouteResponseData {
    /** Locale-agnostic path (client prepends `/{locale}`); null when unroutable. */
    path: string | null
}

/** Apollo response shape for the `resolveRoute` query. */
export interface QueryResolveRouteResponse {
    /** Top-level `resolveRoute` field wrapping the standard API response. */
    resolveRoute: GraphQLResponse<QueryResolveRouteResponseData>
}
