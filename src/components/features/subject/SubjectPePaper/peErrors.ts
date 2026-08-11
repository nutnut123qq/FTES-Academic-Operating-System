import { RestError } from "@/modules/api/rest/client"

/**
 * i18n key suffix under `subjects.practice.pe.errors.*` for a PE answer rejection.
 */
export type PeSubmitErrorKey =
    | "attemptLimit"
    | "graderUnavailable"
    | "gradingFailed"
    | "rateLimited"
    | "unauthorized"
    | "forbidden"
    | "notFound"
    | "tooLarge"
    | "validation"
    | "network"
    | "server"
    | "generic"

/** Domain error codes the PE submit endpoint throws, mapped to a user-facing key. */
const ERROR_CODE_KEYS: Record<string, PeSubmitErrorKey> = {
    RESOURCE_PE_ATTEMPT_LIMIT: "attemptLimit",
    RESOURCE_PE_GRADER_UNAVAILABLE: "graderUnavailable",
    RESOURCE_PE_GRADING_FAILED: "gradingFailed",
    RESOURCE_RATE_LIMITED: "rateLimited",
    RESOURCE_ACCESS_DENIED: "forbidden",
    RESOURCE_NOT_FOUND: "notFound",
    RESOURCE_FILE_TOO_LARGE: "tooLarge",
    RESOURCE_VALIDATION: "validation",
}

/**
 * Classifies a failed PE answer submission into the message key to show.
 *
 * The domain `errorCode` wins over the HTTP status, because the two 429s mean different
 * things: `RESOURCE_PE_ATTEMPT_LIMIT` is "you have used all your attempts" (permanent —
 * retrying never helps) while `RESOURCE_RATE_LIMITED` is "slow down" (retry later). A
 * status-only mapping would tell a student out of attempts to try again in a minute.
 *
 * @param error - Whatever the submit rejected with.
 * @returns The `subjects.practice.pe.errors.<key>` suffix to render.
 */
export const classifyPeSubmitError = (error: unknown): PeSubmitErrorKey => {
    if (error instanceof RestError) {
        const byCode = error.errorCode ? ERROR_CODE_KEYS[error.errorCode] : undefined
        if (byCode) {
            return byCode
        }
        if (error.status === 0) return "network"
        if (error.status === 401) return "unauthorized"
        if (error.status === 403) return "forbidden"
        if (error.status === 404) return "notFound"
        if (error.status === 413) return "tooLarge"
        if (error.status === 429) return "rateLimited"
        if (error.status >= 500) return "server"
        return "generic"
    }
    // A rejected `fetch` (offline / CORS / aborted) is a TypeError, not a RestError.
    if (error instanceof TypeError) {
        return "network"
    }
    return "generic"
}
