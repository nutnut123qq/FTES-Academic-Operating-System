import type { SessionView } from "@/modules/api/rest/identity"

/**
 * The learner's sessions split by whose device they are.
 */
export interface PartitionedSessions {
    /** The session making the current request, or `null` when the backend flags none. */
    current: SessionView | null
    /** Every OTHER signed-in session, most recently used first. */
    others: Array<SessionView>
}

/**
 * Splits the session list into "this device" and everything else, sorting the others
 * by last use (most recent first, sessions with no timestamp last).
 *
 * The split is what makes the list safe: the current session is shown but never gets a
 * per-row sign-out (a learner must not end their own session by mis-clicking a row),
 * and "sign out everywhere else" is offered only when there IS somewhere else.
 *
 * @param sessions - Sessions as returned by `GET /identity/sessions`.
 * @returns The current session (or `null`) and the sorted remainder.
 */
export const partitionSessions = (
    sessions: Array<SessionView>,
): PartitionedSessions => {
    const current = sessions.find((session) => session.current) ?? null
    const others = sessions
        .filter((session) => !session.current)
        .sort((left, right) => sessionRecency(right) - sessionRecency(left))
    return { current, others }
}

/**
 * Sort key for a session: the last-used timestamp in milliseconds, or `-Infinity`
 * when the backend reported none (those sink to the bottom of the list).
 *
 * @param session - The session to rank.
 * @returns Milliseconds since epoch, or `-Infinity`.
 */
const sessionRecency = (session: SessionView): number => {
    const raw = session.lastUsedAt ?? session.createdAt
    if (!raw) {
        return Number.NEGATIVE_INFINITY
    }
    const time = new Date(raw).getTime()
    return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

/**
 * Human label for a session's device.
 *
 * `deviceInfo` is optional and often blank (a client that sent no device hint), so a
 * row must never render an empty title — it falls back to the localized "unknown
 * device" copy the caller passes in.
 *
 * @param session - The session to label.
 * @param unknownLabel - Localized fallback, e.g. "Thiết bị không xác định".
 * @returns The device description, or the fallback.
 */
export const resolveSessionDeviceLabel = (
    session: SessionView,
    unknownLabel: string,
): string => {
    const label = session.deviceInfo?.trim()
    return label ? label : unknownLabel
}

/**
 * Joins the parts of a row's secondary line, dropping the ones the backend did not
 * report, so a session with no IP never renders a dangling separator.
 *
 * @param parts - Candidate fragments in display order.
 * @returns The fragments joined with " · ", or an empty string when none survive.
 */
export const joinSessionMeta = (
    parts: Array<string | undefined | null>,
): string =>
    parts
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part))
        .join(" · ")
