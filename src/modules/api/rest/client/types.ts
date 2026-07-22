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
    /**
     * Course tied to the failure (course UUID) — set on `CHALLENGE_COURSE_ACCESS_DENIED`
     * so the FE can render the enroll / upgrade CTA. NON_NULL-serialized on the BE →
     * absent on every other error.
     */
    courseId?: string | null
    /**
     * Package slugs that DO unlock the gated lesson (challenge-lesson-level-access-gate):
     * present on `CHALLENGE_COURSE_ACCESS_DENIED` when the challenge is attached to a
     * lesson, so a viewer who bought a lower tier can be offered the right upgrade.
     * Defensive-optional — older BE builds omit it.
     */
    requiredPackageSlugs?: Array<string> | null
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
