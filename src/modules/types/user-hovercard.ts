/**
 * Lightweight public user payload used exclusively by the hovercard card.
 * Mirrors a subset of {@link UserEntity} so the hover query stays small.
 */
export interface UserHovercardData {
    /** Global user id (needed by the follow mutation). */
    id: string
    /** URL-facing handle. */
    username: string
    /** Preferred display name; falls back to username when absent. */
    displayName?: string | null
    /** Short public bio. */
    bio?: string | null
    /** Uploaded avatar URL. */
    avatar?: string | null
    /** Number of users following this user. */
    followerCount?: number
    /** Number of users this user follows. */
    followingCount?: number
    /** Whether the authenticated viewer follows this user. */
    isFollowedByMe?: boolean
}
