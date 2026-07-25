/**
 * Pure helpers for the group Resources tab. Kept free of React so the parsing
 * rules can be unit-tested without rendering.
 */

/**
 * Normalizes what the user typed in the "link a resource" field into a bare
 * resource id. The field accepts BOTH a raw id and a pasted resource URL
 * (`https://…/vi/resources/<id>`, `/resources/<id>?tab=versions`, …), because
 * copying the address bar is what people actually do.
 *
 * Query string and hash are dropped, then the last non-empty path segment wins.
 * An input that is already a bare id passes through untouched.
 *
 * @param raw - the raw field value.
 * @returns the extracted resource id, or `""` when nothing usable was typed.
 */
export const extractResourceId = (raw: string): string => {
    const value = raw.trim()
    if (value === "") {
        return ""
    }
    const withoutQuery = value.split("?")[0].split("#")[0]
    const segments = withoutQuery.split("/").filter((segment) => segment !== "")
    if (segments.length === 0) {
        return ""
    }
    const last = segments[segments.length - 1]
    // A protocol-only paste ("https://") collapses to the host — treat the whole
    // input as the id rather than silently linking the host name.
    return last === "" ? value : last
}
