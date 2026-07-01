import { publicEnv } from "@/resources/env/public"

/**
 * Builds the public HTTP URL for a mount foundations file (external-link kind).
 * @param value - Absolute URL or path relative to `.mount/data/foundations`.
 */
export const resolveFoundationMountFileUrl = (
    value: string,
): string => {
    const trimmed = value.trim()
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed
    }
    const apiBase = publicEnv().api.http.replace(/\/$/, "")
    const normalized = trimmed.replace(/^\/+/, "")
    return `${apiBase}/mount/foundations/${normalized}`
}
