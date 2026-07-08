import type { AxiosRequestConfig } from "axios"

/**
 * Standard backend error payload nested inside the envelope `data` field
 * when the response represents a failure.
 *
 * Mirrors `vn.ftes.aos.platform.api.ErrorBody`.
 */
export interface RestErrorBody {
    /** Domain error code, e.g. `CHALLENGE_UNAUTHENTICATED`. */
    errorCode: string
    /** Trace id for log correlation. */
    traceId: string
    /** Optional field-level validation errors. */
    details: Array<{
        /** Field path. */
        field: string
        /** Human-readable issue. */
        issue: string
    }>
}

/**
 * Standard backend envelope returned by every `/api/v1/*` REST endpoint.
 *
 * Mirrors `vn.ftes.aos.platform.api.ApiResponse<T>`.
 */
export interface RestApiResponse<T> {
    /** HTTP status code repeated in the body. */
    code: number
    /** Human-readable message. */
    message: string
    /** Payload on success; `RestErrorBody` on failure; nullable. */
    data: T | null
}

/**
 * Configuration for a single REST request.
 *
 * Extends the axios request config and adds an authentication flag.
 */
export interface RestRequestConfig extends AxiosRequestConfig {
    /**
     * When `true` (the default), the Keycloak access token — if present in local storage — is
     * attached as `Authorization: Bearer <token>` for ANY method. Public endpoints ignore a
     * stale/invalid token, so this is safe and keeps authenticated GETs (streak, lesson content,
     * `/me/*`, admin reads) working. Pass `false` to force an unauthenticated request.
     */
    authenticated?: boolean
}
