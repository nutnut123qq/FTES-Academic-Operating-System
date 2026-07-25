import { RestError } from "@/modules/api/rest/client"

/**
 * Map a failed community write to the i18n key of the message the viewer should
 * see. Keeps every post/comment mutation in this feature honest about WHY a write
 * failed instead of collapsing 403 / 404 / 409 / 429 into one generic toast.
 *
 * 401 is deliberately NOT handled here: the auth guard (`useRequireAuth`) runs
 * BEFORE the write, so a 401 means the session expired mid-flight and falls back
 * to the caller's generic message.
 *
 * @param error - the rejection from a REST call (any thrown value).
 * @param fallbackKey - message key used when nothing more specific applies.
 * @returns the `communityHub.*` message key to toast.
 */
export const communityErrorMessageKey = (error: unknown, fallbackKey: string): string => {
    if (!(error instanceof RestError)) {
        return fallbackKey
    }
    switch (error.status) {
    case 403:
        return "engagement.forbidden"
    case 404:
        return "engagement.notFound"
    case 409:
        // the only 409 a reporter can trigger is an already-open report
        return error.errorCode === "COMMUNITY_DUPLICATE_REPORT"
            ? "engagement.reportDuplicate"
            : fallbackKey
    case 429:
        return "engagement.rateLimited"
    default:
        return fallbackKey
    }
}
