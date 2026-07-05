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
     * When `true`, the Keycloak access token is read from local storage and
     * attached as `Authorization: Bearer <token>`. Defaults to `true` for
     * mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`).
     */
    authenticated?: boolean
}
