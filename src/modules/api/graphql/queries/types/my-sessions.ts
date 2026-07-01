import type { GraphQLResponse } from "../../types"

/** One of the current user's logged-in device sessions. */
export interface LoginSession {
    /** Stable primary-key id of the session row. */
    id: string
    /** Session id; pass this to `revokeSession` to log the device out. */
    sessionId: string
    /** Device class, e.g. "desktop" | "mobile" | "tablet"; null when unknown. */
    deviceType: string | null
    /** Operating system name; null when unknown. */
    os: string | null
    /** Browser name; null when unknown. */
    browser: string | null
    /** Client IP captured at login; null when unknown. */
    ipAddress: string | null
    /** Human-readable location derived from the IP; null when unknown. */
    location: string | null
    /** Last-activity timestamp (ISO string). */
    lastSeenAt: string
    /** Session creation timestamp (ISO string). */
    createdAt: string
    /** True when this is the device making the current request. */
    current: boolean
}

/** Payload inside `mySessions.data` after the standard API wrapper. */
export interface QueryMySessionsResponseData {
    /** All active device sessions for the current user (most-recent first). */
    data: Array<LoginSession>
}

/** Apollo response shape for the `mySessions` query. */
export interface QueryMySessionsResponse {
    /** Top-level `mySessions` field wrapping the standard API response. */
    mySessions: GraphQLResponse<QueryMySessionsResponseData>
}
